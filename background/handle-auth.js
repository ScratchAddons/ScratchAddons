import { startCache } from "./message-cache.js";
import { openMessageCache } from "../libraries/common/message-cache.js";
import { purgeDatabase } from "../addons/scratch-notifier/notifier.js";
import { isFirefox } from "../libraries/common/cs/detect-browser.js";

async function getDefaultStoreId() {
  const CHROME_DEFAULT = "0";
  const FIREFOX_DEFAULT = "firefox-default";

  try {
    const cookieStores = await chrome.cookies.getAllCookieStores();

    if (!cookieStores || cookieStores.length === 0) {
      throw new Error("No cookie stores were found.");
    }

    if (cookieStores.some((store) => store.id === CHROME_DEFAULT)) {
      // Chrome
      return (scratchAddons.cookieStoreId = CHROME_DEFAULT);
    }

    if (cookieStores.some((store) => store.id === FIREFOX_DEFAULT)) {
      // Firefox
      return (scratchAddons.cookieStoreId = FIREFOX_DEFAULT);
    }

    return (scratchAddons.cookieStoreId = cookieStores[0].id);
  } catch (error) {
    console.error(
      "Scratch Addons: Failed to get the default cookie store:",
      error
    );

    throw error;
  }
}

/*
 * Initialize authentication and message cache.
 *
 * Catch errors here so an initialization failure does not produce:
 * "Uncaught (in promise)"
 */
(async function initialize() {
  try {
    const defaultStoreId = await getDefaultStoreId();

    console.log("Default cookie store ID:", defaultStoreId);

    await checkSession(true);

    startCache(defaultStoreId);

    console.log("Scratch Addons: Authentication initialized.");
  } catch (error) {
    console.error(
      "Scratch Addons: Failed to initialize authentication:",
      error
    );

    /*
     * Keep the extension in a safe unauthenticated state
     * instead of leaving partially initialized data behind.
     */
    scratchAddons.cookieStoreId = null;

    scratchAddons.globalState.auth = {
      isLoggedIn: false,
      username: null,
      userId: null,
      xToken: null,
      csrfToken: null,
      scratchLang: navigator.language,
    };
  }
})();

const onCookiesChanged = ({ cookie, cause, removed }) => {
  /*
   * We already know that this is true:
   *
   * cookie.name === "scratchsessionsid"
   * || cookie.name === "scratchlanguage"
   * || cookie.name === "scratchcsrftoken"
   */

  if (cookie.name === "scratchlanguage") {
    setLanguage();
  } else if (!scratchAddons.cookieStoreId) {
    getDefaultStoreId()
      .then(() => checkSession())
      .catch((error) => {
        console.error(
          "Scratch Addons: Failed to update cookie store:",
          error
        );
      });
  } else if (
    cookie.storeId === scratchAddons.cookieStoreId &&
    !(
      cookie.name === "scratchcsrftoken" &&
      cookie.value === scratchAddons.globalState.auth.csrfToken
    )
  ) {
    checkSession()
      .then(() => {
        if (cookie.name === "scratchsessionsid") {
          startCache(scratchAddons.cookieStoreId, true);
          purgeDatabase();
        }
      })
      .catch((error) => {
        console.error(
          "Scratch Addons: Failed to check session after cookie change:",
          error
        );
      });
  } else if (cookie.name === "scratchsessionsid") {
    /*
     * Clear message cache for the store.
     * This is not the main one, so we don't refetch here.
     */
    openMessageCache(cookie.storeId, true);
  }

  notify(cookie);
};

const COOKIE_CHANGE_RATE_LIMIT = 5000;

// We store cookies.onChanged events here.
const queue = [];

// The integer ID returned by setInterval.
let timer = null;

// Resets to 0 after each burst ends.
let n = 0;

const process = ({ clearIntervalIfQueueEmpty }) => {
  if (queue.length > 0) {
    const item = queue.shift();

    try {
      onCookiesChanged(item);
    } catch (error) {
      console.error(
        "Scratch Addons: Failed to process cookie change:",
        error
      );
    }

    if (clearIntervalIfQueueEmpty) {
      console.log("Processed cookies.onChanged event from queue.");
    }
  }

  if (clearIntervalIfQueueEmpty && queue.length === 0) {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    n = 0;
  }
};

const addToQueue = (item) => {
  const { cookie } = item;

  if (
    cookie.name !== "scratchsessionsid" &&
    cookie.name !== "scratchlanguage" &&
    cookie.name !== "scratchcsrftoken"
  ) {
    // Ignore this event.
    return;
  }

  queue.push(item);
  n++;

  if (timer === null) {
    timer = setInterval(
      () => process({ clearIntervalIfQueueEmpty: true }),
      COOKIE_CHANGE_RATE_LIMIT
    );

    /*
     * setInterval may not work as expected in the extension
     * background context, but worst that can happen is that
     * we discard events instead of processing them later.
     */
  }

  if (n <= 5) {
    /*
     * Process first 5 events immediately.
     * This gets reset after receiving 0 events for
     * COOKIE_CHANGE_RATE_LIMIT milliseconds.
     */
    process({ clearIntervalIfQueueEmpty: false });
  }

  if (queue.length > 8) {
    // If queue has more than 8 items, remove the oldest one.
    queue.shift();
  }
};

chrome.cookies.onChanged.addListener((event) => {
  try {
    addToQueue(event);
  } catch (error) {
    console.error(
      "Scratch Addons: Failed to process cookies.onChanged event:",
      error
    );
  }
});

function getCookieValue(name) {
  return new Promise((resolve) => {
    try {
      chrome.cookies.get(
        {
          url: "https://scratch.mit.edu/",
          name,
        },
        (cookie) => {
          if (chrome.runtime.lastError) {
            console.warn(
              `Scratch Addons: Failed to read cookie "${name}":`,
              chrome.runtime.lastError.message
            );

            resolve(null);
            return;
          }

          if (cookie && cookie.value) {
            resolve(cookie.value);
          } else {
            resolve(null);
          }
        }
      );
    } catch (error) {
      console.warn(
        `Scratch Addons: Exception while reading cookie "${name}":`,
        error
      );

      resolve(null);
    }
  });
}

async function setLanguage() {
  try {
    scratchAddons.globalState.auth.scratchLang =
      (await getCookieValue("scratchlanguage")) || navigator.language;
  } catch (error) {
    console.warn(
      "Scratch Addons: Failed to update language:",
      error
    );
  }
}

let isChecking = false;

async function checkSession(firstTime = false) {
  if (isChecking) {
    return;
  }

  isChecking = true;

  let res;
  let json;

  try {
    const { scratchSession } =
      (await chrome.storage.session?.get("scratchSession")) ?? {};

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

        if (!res.ok) {
          throw new Error(
            `Session request failed with HTTP ${res.status}`
          );
        }

        json = await res.json();

        try {
          await chrome.storage.session?.set({
            scratchSession: json,
          });
        } catch (storageError) {
          console.warn(
            "Scratch Addons: Failed to cache session:",
            storageError
          );
        }
      } catch (err) {
        console.warn(
          "Scratch Addons: Failed to fetch Scratch session:",
          err
        );

        /*
         * If Scratch is down or there is no internet connection,
         * recheck soon.
         */
        isChecking = false;

        setTimeout(() => {
          checkSession().catch((error) => {
            console.warn(
              "Scratch Addons: Scheduled session check failed:",
              error
            );
          });
        }, 60000);

        scratchAddons.globalState.auth = {
          isLoggedIn: false,
          username: null,
          userId: null,
          xToken: null,
          csrfToken: null,
          scratchLang:
            (await getCookieValue("scratchlanguage")) ||
            navigator.language,
        };

        return;
      }
    }

    const scratchLang =
      (await getCookieValue("scratchlanguage")) ||
      navigator.language;

    const csrfToken =
      await getCookieValue("scratchcsrftoken");

    scratchAddons.globalState.auth = {
      isLoggedIn: Boolean(json?.user),
      username: json?.user ? json.user.username : null,
      userId: json?.user ? json.user.id : null,
      xToken: json?.user ? json.user.token : null,
      csrfToken,
      scratchLang,
    };
  } catch (error) {
    /*
     * Catch unexpected errors so checkSession itself
     * never produces an unhandled Promise rejection.
     */
    console.error(
      "Scratch Addons: Unexpected error while checking session:",
      error
    );

    scratchAddons.globalState.auth = {
      isLoggedIn: false,
      username: null,
      userId: null,
      xToken: null,
      csrfToken: null,
      scratchLang: navigator.language,
    };
  } finally {
    isChecking = false;
  }
}

function notify(cookie) {
  if (cookie.name === "scratchlanguage") {
    return;
  }

  const storeId = cookie.storeId;
  const cond = {};

  if (isFirefox()) {
    cond.cookieStoreId = storeId;
  }

  /*
   * On Chrome this can cause unnecessary session re-fetch,
   * but there should be no harm (aside from extra requests).
   */
  chrome.tabs.query(cond, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "Scratch Addons: Failed to query tabs:",
        chrome.runtime.lastError.message
      );
      return;
    }

    tabs.forEach((tab) => {
      if (!tab.id) {
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tab.id,
          "refetchSession",
          () => {
            /*
             * Ignore tabs where the content script isn't present.
             * Reading lastError prevents Chrome from reporting
             * an unchecked runtime error.
             */
            void chrome.runtime.lastError;
          }
        );
      } catch (error) {
        console.warn(
          "Scratch Addons: Failed to notify tab:",
          error
        );
      }
    });
  });

  /*
   * Notify popups, since they also fetch sessions independently.
   */
  try {
    scratchAddons.sendToPopups({
      refetchSession: true,
    });
  } catch (error) {
    console.warn(
      "Scratch Addons: Failed to notify popups:",
      error
    );
  }
}
