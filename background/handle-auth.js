import { startCache } from "./message-cache.js";
import { openMessageCache } from "../libraries/common/message-cache.js";
import { purgeDatabase } from "../addons/scratch-notifier/notifier.js";

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

async function getDefaultStoreId() {
  const CHROME_DEFAULT = "0";
  const FIFEFOX_DEFAULT = "firefox-default";
  const cookieStores = await chrome.cookies.getAllCookieStores();
  if (cookieStores.length === 0) throw "Unable to find a default cookie store!";
  if (cookieStores.some((store) => store.id === CHROME_DEFAULT)) {
    // Chrome
    return (scratchAddons.cookieStoreId = CHROME_DEFAULT);
  }
  if (cookieStores.some((store) => store.id === FIFEFOX_DEFAULT)) {
    // Firefox
    return (scratchAddons.cookieStoreId = FIFEFOX_DEFAULT);
  }
  return (scratchAddons.cookieStoreId = cookieStores[0].id);
}

(async function () {
  const defaultStoreId = await getDefaultStoreId();
  console.log("Default cookie store ID: ", defaultStoreId);
  await checkSession(true);
  startCache(defaultStoreId);
})();

// We store cookies.onChanged events here. We'll try to process them all, but there's no guarantee.
const cookieQueue = [];

let processTimeout;
const TIMEOUT_INTERVAL = 500;
let isProcessing = false;

const addToQueue = (item) => {
  // This is to prevent a race condition which has a 1 in a billion chance of occurance.
  if (!scratchAddons.cookieStoreId) {
    console.log("ignored cookies due to default store not found");
    return;
  }

  if (isProcessing) {
    console.log("ignored cookies due to processing");
    return;
  }

  const { cookie } = item;
  if (cookie.name !== "scratchsessionsid" && cookie.name !== "scratchcsrftoken") {
    // Ignore this event
    return;
  }

  cookieQueue.push(cookie);
  clearTimeout(processTimeout);
  processTimeout = setTimeout(processCookieChanges, TIMEOUT_INTERVAL);
};

const oldCookies = {};

const processCookieChanges = () => {
  // Organize cookie changes by which store they occur in and get fill with most recent cookie changes.
  const cookieChangesByStore = {};
  // Reverse the array since the last cookie changes are the most recent ones.
  for (const change of cookieQueue.reverse()) {
    const changes = cookieChangesByStore[change.storeId] || {};
    // Check if we already found a more recent cookie
    // Note the only cookie names possible are "scratchsessionsid" or "scratchcsrftoken"
    if (changes[change.name]) continue;
    // Check if this cookie changed from the last time
    if (oldCookies[change.name] === change.value) continue;
    changes[change.name] = change;
    oldCookies[change.name] = change.value;
    cookieChangesByStore[change.storeId] = changes;
  }
  // Reset Queue
  cookieQueue.length = 0;

  const processes = [];
  for (const storeId in cookieChangesByStore) {
    const changes = cookieChangesByStore[storeId];
    if (scratchAddons.cookieStoreId === storeId) {
      // Recheck session if the changed cookie occurs in the default store.
      // We don't care if it happens in the other stores since currently we only use session data from default
      processes.push(
        checkSession().then(() => {
          // The session id changing means we need to refetch all messages
          // That's why the second parameter of startCache is set to true, to force clear.
          if (changes.scratchsessionsid) {
            return Promise.all([startCache(storeId, true), purgeDatabase()]);
          }
        })
      );
    } else if (changes.scratchsessionsid) {
      // Clear message cache for the store
      // This is not the main one, so we don't refetch here
      processes.push(openMessageCache(storeId, true));
    }
  }

  isProcessing = true;
  // Run all processes, then allow any new cookie changes to occur
  // Note that it is possible for no processes need to be ran
  // That would occur if the scratchcsrftoken token changes in a store other than the default one
  Promise.all(processes).then(() => (isProcessing = false));

  // Notify open tabs and popups
  notify(Object.keys(cookieChangesByStore));
};
chrome.cookies.onChanged.addListener(addToQueue);

function getCookieValue(name) {
  return new Promise((resolve) => {
    chrome.cookies.get(
      {
        url: "https://scratch.mit.edu/",
        name,
      },
      (cookie) => {
        if (cookie && cookie.value) resolve(cookie.value);
        else resolve(null);
      }
    );
  });
}

let isChecking = false;

async function checkSession(firstTime = false) {
  let res;
  let json;
  if (isChecking) return;
  isChecking = true;
  const { scratchSession } = (await chrome.storage.session?.get("scratchSession")) ?? {};

  const scratchLang = (await getCookieValue("scratchlanguage")) || navigator.language;

  if (firstTime && scratchSession) {
    console.log("Used cached /session info.");
    json = scratchSession;
  } else {
    try {
      res = await fetch("https://scratch.mit.edu/session/", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      json = await res.json();
      chrome.storage.session?.set({ scratchSession: json });
    } catch (err) {
      console.warn(err);
      json = {};
      // If Scratch is down, or there was no internet connection, recheck soon:
      if ((res && !res.ok) || !res) {
        isChecking = false;
        setTimeout(checkSession, 60000);
        scratchAddons.globalState.auth = {
          isLoggedIn: false,
          username: null,
          userId: null,
          xToken: null,
          csrfToken: null,
          scratchLang,
        };
        return;
      }
    }
  }
  const csrfToken = await getCookieValue("scratchcsrftoken");
  scratchAddons.globalState.auth = {
    isLoggedIn: Boolean(json.user),
    username: json.user ? json.user.username : null,
    userId: json.user ? json.user.id : null,
    xToken: json.user ? json.user.token : null,
    csrfToken,
    scratchLang,
  };
  isChecking = false;
}

function notify(storeIds) {
  const cond = {};
  if (typeof browser === "object") {
    // Firefox-exclusive. Chrome does not have this option.
    cond.cookieStoreId = storeIds;
  }
  // On Chrome this can cause unnecessary session re-fetch, but there should be
  // no harm (aside from extra requests) when doing so.
  // On top of that, we still send this message to every tab in the store; not good with lots of tabs open.
  // In the future, we should try to only send this to one tab, or maybe have data sent to all tabs
  // so that less requests are made.
  chrome.tabs.query(cond, (tabs) =>
    tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, "refetchSession", () => void chrome.runtime.lastError))
  );
  // Notify popups, since they also fetch sessions independently
  scratchAddons.sendToPopups({ refetchSession: true });
}
