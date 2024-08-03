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
  if (cookieStores.length === 0) throw "";
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
  if (processTimeout) {
    clearTimeout(processTimeout);
  }
  processTimeout = setTimeout(processCookieChanges, TIMEOUT_INTERVAL);
};

const processCookieChanges = () => {
  // Keys could only be "scratchsessionsid" or "scratchcsrftoken"
  const mostRecentCookies = {};
  // Reverse the array since the last cookie changes are the most recent ones.
  for (const change of cookieQueue.reverse()) {
    if (!mostRecentCookies[change.name]) {
      mostRecentCookies[change.name] = change;
    }
  }

  // Get the store id of the last cookie
  const lastCookieStoreID = cookieQueue.at(-1).storeId;
  // Reset Queue
  cookieQueue.length = 0;

  isProcessing = true;
  const processes = [];

  // Because the "scratchlanguage" cookie is not marked as secure by scratch, we won't get notified for it changes.
  // Therefore, we must always run setLanguage since we don't actually know when it changes.
  processes.push(setLanguage);

  if (!scratchAddons.cookieStoreId) {
    processes.push(getDefaultStoreId().then(checkSession));
  }
  if (
    // do not refetch for csrf token expiration date change
    lastCookieStoreID === scratchAddons.cookieStoreId &&
    !(
      mostRecentCookies.scratchcsrftoken &&
      mostRecentCookies.scratchcsrftoken.value === scratchAddons.globalState.auth.csrfToken
    )
  ) {
    processes.push(
      checkSession().then(() => {
        if (mostRecentCookies.scratchsessionsid) {
          return Promise.all([startCache(scratchAddons.cookieStoreId, true), purgeDatabase()]);
        }
      })
    );
  }
  if (mostRecentCookies.scratchsessionsid) {
    // Clear message cache for the store
    // This is not the main one, so we don't refetch here
    processes.push(openMessageCache(mostRecentCookies.scratchsessionsid.storeId, true));
  }

  Promise.all(processes).then(() => (isProcessing = false));
  notify(lastCookieStoreID);
};
chrome.cookies.onChanged.addListener((e) => addToQueue(e));

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

async function setLanguage() {
  scratchAddons.globalState.auth.scratchLang = (await getCookieValue("scratchlanguage")) || navigator.language;
}

let isChecking = false;

async function checkSession(firstTime = false) {
  let res;
  let json;
  if (isChecking) return;
  isChecking = true;
  const { scratchSession } = (await chrome.storage.session?.get("scratchSession")) ?? {};
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
          scratchLang: (await getCookieValue("scratchlanguage")) || navigator.language,
        };
        return;
      }
    }
  }
  const scratchLang = (await getCookieValue("scratchlanguage")) || navigator.language;
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

function notify(storeId) {
  const cond = {};
  if (typeof browser === "object") {
    // Firefox-exclusive.
    cond.cookieStoreId = storeId;
  }
  // On Chrome this can cause unnecessary session re-fetch, but there should be
  // no harm (aside from extra requests) when doing so.
  chrome.tabs.query(cond, (tabs) =>
    tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, "refetchSession", () => void chrome.runtime.lastError))
  );
  // Notify popups, since they also fetch sessions independently
  scratchAddons.sendToPopups({ refetchSession: true });
}
