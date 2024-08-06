import { startCache } from "./message-cache.js";
import { openMessageCache } from "../libraries/common/message-cache.js";
import { purgeDatabase } from "../addons/scratch-notifier/notifier.js";

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const CHROME_DEFAULT = "0";
const FIFEFOX_DEFAULT = "firefox-default";
async function getDefaultStoreId() {
  const cookieStores = await chrome.cookies.getAllCookieStores();
  // This should technically never occur.
  if (cookieStores.length === 0) throw "Unable to find a default cookie store!";
  // Usually the chrome/ff default is the first in the list, but just in case...
  if (cookieStores.some((store) => store.id === CHROME_DEFAULT)) {
    return CHROME_DEFAULT;
  }
  if (cookieStores.some((store) => store.id === FIFEFOX_DEFAULT)) {
    return FIFEFOX_DEFAULT;
  }
  return cookieStores[0].id; // Just in case
}

(async function () {
  // If this key wasn't made in the storage, it's likely the first time this code has ever ran.
  // This can also run if a fetch to /session failed and a refetch it needed.
  const { checkedSession } = (await chrome.storage.session?.get("checkedSession")) ?? {};

  scratchAddons.cookieStoreId = await getDefaultStoreId();
  console.log("Default cookie store ID: ", defaultStoreId);
  // This won't actually do anything if the service worker falls asleep and wakes up
  // since one of the checkSessions above will run, setting isCheckingSession to true.
  await checkSession(!checkedSession);
  startCache(defaultStoreId);
})();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "recheckSession") {
    console.log("Rechecking session...");
    // If the service worker is just waking up, it's likely the checkSession above will run and this won't.
    // That's because isCheckingSession will be true and stop this one.
    checkSession(true);
  }
});

// We store cookies.onChanged events here.
const cookieQueue = [];

// The amount of time (ms) before we run process code after cookies are changed.
// Every time a new cookie is added to the queue, we reset the timeout.
const TIMEOUT_DURATION = 500;
let processTimeout;
let isProcessing = false;

const addToQueue = (item) => {
  // This is to prevent a race condition which has a 1 in a billion chance of occurance.
  if (!scratchAddons.cookieStoreId) {
    console.log("ignored cookies due to default store not found");
    return;
  }

  // This is so we never run into infinite loops.
  // It is possible that we miss important cookie changes.
  // But it's worth it. Trust me.
  if (isProcessing) {
    console.log("ignored cookies due to processing");
    return;
  }

  const { cookie } = item;
  if (cookie.name !== "scratchsessionsid" && cookie.name !== "scratchcsrftoken") {
    // These are the only two cookies scratch manages that triggers cookies.onChanged.
    // Any other cookies are made by other programs/the user and should be ignored.
    return;
  }

  cookieQueue.push(cookie);
  clearTimeout(processTimeout);
  processTimeout = setTimeout(processCookieChanges, TIMEOUT_DURATION);
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

// Note scratchlanguage is not marked as "secure" and does not trigger cookies.onChanged.
// Thus would never possibily get added to the queue.
chrome.cookies.onChanged.addListener(addToQueue);

// It's good to know that chrome.cookies works without internet connection.
const getCookieValue = async (name) => {
  const cookie = await chrome.cookies.get({
    url: "https://scratch.mit.edu/",
    name,
  });
  return (cookie && cookie.value) || null;
};

let isCheckingSession = false;
async function checkSession(forceFetch = false) {
  let sessionData = {};
  if (isCheckingSession) return;
  isCheckingSession = true;

  const getStorageSession = async () => {
    const { scratchSession } = (await chrome.storage.session?.get("scratchSession")) ?? {};
    return scratchSession || {};
  };

  // If the service worker is running this function on wake up, use cached data.
  // Otherwise, try fetching /session and store session data.
  if (!forceFetch) {
    console.log("Used cached /session info.");
    sessionData = await getStorageSession();
  } else {
    sessionData = await fetch("https://scratch.mit.edu/session/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((res) => (res.ok ? res : Promise.reject(res)))
      .then((res) => res.json())
      .catch(async () => {
        // This could happen if there was no internet connection or Scratch is down
        // Either way, recheck after a minute.
        await chrome.alarms.create("recheckSession", { delayInMinutes: 1 });
        await chrome.storage.session?.set({ checkedSession: false });
        isCheckingSession = false;
        throw "Fetch to /session failed. Retrying in one minute.";
      });
    chrome.storage.session?.set({ scratchSession: sessionData });
  }
  const isLoggedIn = Boolean(sessionData.user);
  const { username, id: userId, token: xToken } = sessionData.user || {};

  const scratchLang = (await getCookieValue("scratchlanguage")) || navigator.language;
  const csrfToken = await getCookieValue("scratchcsrftoken");

  scratchAddons.globalState.auth = {
    isLoggedIn,
    username,
    userId,
    xToken,
    csrfToken,
    scratchLang,
  };

  await chrome.storage.session?.set({ checkedSession: true });
  isCheckingSession = false;
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
