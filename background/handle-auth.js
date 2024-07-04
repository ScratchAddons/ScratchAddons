import { startCache } from "./message-cache.js";
import { openMessageCache } from "../libraries/common/message-cache.js";
import { purgeDatabase } from "../addons/scratch-notifier/notifier.js";

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

function getDefaultStoreId() {
  // Request Scratch to set the CSRF token.
  return fetch("https://scratch.mit.edu/csrf_token/", {
    credentials: "include",
  })
    .catch(() => {})
    .then(() =>
      promisify(chrome.cookies.get)({
        url: "https://scratch.mit.edu/",
        name: "scratchcsrftoken",
      })
    )
    .then((cookie) => {
      return (scratchAddons.cookieStoreId = cookie.storeId);
    });
}

(async function () {
  const defaultStoreId = await getDefaultStoreId();
  console.log("Default cookie store ID: ", defaultStoreId);
  await checkSession();
  startCache(defaultStoreId);
})();

const onCookiesChanged = ({ cookie, cause, removed }) => {
  // We already know that this is true:
  // `cookie.name === "scratchsessionsid" || cookie.name === "scratchlanguage" || cookie.name === "scratchcsrftoken"`
  if (cookie.name === "scratchlanguage") {
    setLanguage();
  } else if (!scratchAddons.cookieStoreId) {
    getDefaultStoreId().then(() => checkSession());
  } else if (
    // do not refetch for csrf token expiration date change
    cookie.storeId === scratchAddons.cookieStoreId &&
    !(cookie.name === "scratchcsrftoken" && cookie.value === scratchAddons.globalState.auth.csrfToken)
  ) {
    checkSession().then(() => {
      if (cookie.name === "scratchsessionsid") {
        startCache(scratchAddons.cookieStoreId, true);
        purgeDatabase();
      }
    });
  } else if (cookie.name === "scratchsessionsid") {
    // Clear message cache for the store
    // This is not the main one, so we don't refetch here
    openMessageCache(cookie.storeId, true);
  }
  notify(cookie);
};

const COOKIE_CHANGE_RATE_LIMIT = 1500; // (ms) First events get processed immediately, then rate-limit is used.
const queue = []; // We store cookies.onChanged events here. We'll try to process them all, but there's no guarantee.
let timer = null; // The integer ID returned by setInterval.
let n = 0; // Resets to 0 after each "burst" ends. If number is low, the event is processed with no delay.

const process = ({ clearIntervalIfQueueEmpty }) => {
  if (queue.length > 0) {
    const item = queue.shift();
    onCookiesChanged(item);
    if (clearIntervalIfQueueEmpty) console.log("Processed cookies.onChanged event from queue.");
  }
  if (clearIntervalIfQueueEmpty && queue.length === 0) {
    clearInterval(timer);
    timer = null;
    n = 0;
  }
};
const addToQueue = (item) => {
  const { cookie } = item;
  if (cookie.name !== "scratchsessionsid" && cookie.name !== "scratchlanguage" && cookie.name !== "scratchcsrftoken") {
    // Ignore this event
    return;
  }

  queue.push(item);
  n++;
  if (timer === null) {
    timer = setInterval(() => process({ clearIntervalIfQueueEmpty: true }), COOKIE_CHANGE_RATE_LIMIT);
    // setInterval may not work as expected in the extension background context, but worst
    // that can happen is that we discard events instead of processing them later.
  }
  if (n <= 5) {
    // Process first 5 events immediately (gets reset after receiving 0 events for `COOKIE_CHANGE_RATE_LIMIT` milliseconds)
    process({ clearIntervalIfQueueEmpty: false });
  }
  if (queue.length > 15) {
    // If queue has more than 15 items, remove the oldest one.
    queue.shift();
  }
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

async function checkSession() {
  let res;
  let json;
  if (isChecking) return;
  isChecking = true;
  try {
    res = await fetch("https://scratch.mit.edu/session/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    json = await res.json();
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

function notify(cookie) {
  if (cookie.name === "scratchlanguage") return;
  const storeId = cookie.storeId;
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
