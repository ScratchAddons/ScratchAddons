import { startCache } from './message-cache.js';
import { openMessageCache } from '../libraries/common/message-cache.js';
import { purgeDatabase } from '../addons/scratch-notifier/notifier.js';
import { isFirefox } from '../libraries/common/cs/detect-browser.js';

const CHROME_DEFAULT_STORE = '0';
const FIREFOX_DEFAULT_STORE = 'firefox-default';

const COOKIE_CHANGE_RATE_LIMIT = 5000;
const MAX_COOKIE_QUEUE_SIZE = 8;

let isChecking = false;
let timer = null;
let eventCount = 0;

const queue = [];

/**
 * Get the browser's default cookie store.
 *
 * Chromium normally uses "0".
 * Firefox normally uses "firefox-default".
 *
 * Some browser environments can return an empty array from
 * chrome.cookies.getAllCookieStores(). An empty result is not
 * considered a fatal error.
 */
async function getDefaultStoreId() {
  const fallback = isFirefox()
    ? FIREFOX_DEFAULT_STORE
    : CHROME_DEFAULT_STORE;

  try {
    if (
      !chrome.cookies ||
      typeof chrome.cookies.getAllCookieStores !==
        'function'
    ) {
      console.warn(
        'Scratch Addons: Cookie-store API unavailable. ' +
          `Using "${fallback}".`
      );

      scratchAddons.cookieStoreId = fallback;

      return fallback;
    }

    const cookieStores =
      await chrome.cookies.getAllCookieStores();

    if (Array.isArray(cookieStores) && cookieStores.length > 0) {
      /*
       * Prefer the normal Chromium store when available.
       */
      const chromeStore = cookieStores.find(
        (store) => store.id === CHROME_DEFAULT_STORE
      );

      if (chromeStore) {
        scratchAddons.cookieStoreId =
          CHROME_DEFAULT_STORE;

        return CHROME_DEFAULT_STORE;
      }

      /*
       * Prefer the normal Firefox store when available.
       */
      const firefoxStore = cookieStores.find(
        (store) => store.id === FIREFOX_DEFAULT_STORE
      );

      if (firefoxStore) {
        scratchAddons.cookieStoreId =
          FIREFOX_DEFAULT_STORE;

        return FIREFOX_DEFAULT_STORE;
      }

      /*
       * If the browser exposes another store, use it rather
       * than failing authentication.
       */
      const firstStore = cookieStores[0];

      if (firstStore?.id) {
        scratchAddons.cookieStoreId = firstStore.id;

        return firstStore.id;
      }
    }

    /*
     * IMPORTANT:
     *
     * Do not throw here.
     *
     * An empty cookie-store list should not prevent Scratch
     * Addons authentication from initializing.
     */
    console.warn(
      'Scratch Addons: No cookie stores were returned. ' +
        `Using browser default "${fallback}".`
    );

    scratchAddons.cookieStoreId = fallback;

    return fallback;
  } catch (error) {
    /*
     * Cookie-store enumeration is not required for basic
     * Scratch session authentication.
     */
    console.warn(
      'Scratch Addons: Could not determine the cookie store. ' +
        `Using "${fallback}".`,
      error
    );

    scratchAddons.cookieStoreId = fallback;

    return fallback;
  }
}

/**
 * Reset authentication state.
 */
function resetAuthState() {
  scratchAddons.globalState.auth = {
    isLoggedIn: false,
    username: null,
    userId: null,
    xToken: null,
    csrfToken: null,
    scratchLang:
      typeof navigator !== 'undefined'
        ? navigator.language
        : 'en',
  };
}

/**
 * Initialize authentication and message cache.
 */
async function initialize() {
  try {
    const defaultStoreId =
      await getDefaultStoreId();

    console.log(
      `Scratch Addons: Using cookie store "${defaultStoreId}".`
    );

    await checkSession(true);

    /*
     * Start the message cache even if the cookie-store API
     * returned an empty list. The fallback store is sufficient
     * for the normal browser configuration.
     */
    try {
      startCache(defaultStoreId);
    } catch (error) {
      console.warn(
        'Scratch Addons: Failed to start message cache:',
        error
      );
    }

    console.log(
      'Scratch Addons: Authentication initialized.'
    );
  } catch (error) {
    /*
     * Authentication problems should not terminate the
     * background script.
     */
    console.warn(
      'Scratch Addons: Authentication initialization ' +
        'encountered an error:',
      error
    );

    resetAuthState();
  }
}

void initialize();

/**
 * Safely read a cookie from Scratch.
 */
function getCookieValue(name) {
  return new Promise((resolve) => {
    try {
      if (
        !chrome.cookies ||
        typeof chrome.cookies.get !== 'function'
      ) {
        resolve(null);
        return;
      }

      chrome.cookies.get(
        {
          url: 'https://scratch.mit.edu/',
          name,
        },
        (cookie) => {
          if (chrome.runtime.lastError) {
            console.warn(
              `Scratch Addons: Could not read cookie "${name}":`,
              chrome.runtime.lastError.message
            );

            resolve(null);
            return;
          }

          resolve(cookie?.value || null);
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

/**
 * Update the Scratch language stored by Scratch Addons.
 */
async function setLanguage() {
  try {
    const language =
      await getCookieValue('scratchlanguage');

    scratchAddons.globalState.auth.scratchLang =
      language ||
      (typeof navigator !== 'undefined'
        ? navigator.language
        : 'en');
  } catch (error) {
    console.warn(
      'Scratch Addons: Failed to update language:',
      error
    );
  }
}

/**
 * Check the current Scratch session.
 */
async function checkSession(firstTime = false) {
  if (isChecking) {
    return;
  }

  isChecking = true;

  try {
    let session = null;

    /*
     * Try to use the cached session on startup.
     */
    if (
      firstTime &&
      chrome.storage?.session
    ) {
      try {
        const stored =
          await chrome.storage.session.get(
            'scratchSession'
          );

        if (stored?.scratchSession) {
          console.log(
            'Scratch Addons: Using cached session.'
          );

          session = stored.scratchSession;
        }
      } catch (error) {
        console.warn(
          'Scratch Addons: Failed to read cached session:',
          error
        );
      }
    }

    /*
     * Fetch a fresh session if there is no usable cache.
     */
    if (!session) {
      try {
        const response = await fetch(
          'https://scratch.mit.edu/session/',
          {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Session request returned HTTP ${response.status}.`
          );
        }

        session = await response.json();
      } catch (error) {
        console.warn(
          'Scratch Addons: Failed to fetch Scratch session:',
          error
        );

        resetAuthState();

        /*
         * Scratch may be temporarily unavailable.
         * Retry later without producing an unhandled promise.
         */
        setTimeout(() => {
          void checkSession();
        }, 60000);

        return;
      }

      /*
       * Cache the fresh session if possible.
       */
      if (chrome.storage?.session) {
        try {
          await chrome.storage.session.set({
            scratchSession: session,
          });
        } catch (error) {
          console.warn(
            'Scratch Addons: Failed to cache session:',
            error
          );
        }
      }
    }

    const scratchLang =
      (await getCookieValue('scratchlanguage')) ||
      (typeof navigator !== 'undefined'
        ? navigator.language
        : 'en');

    const csrfToken =
      await getCookieValue('scratchcsrftoken');

    const user = session?.user || null;

    scratchAddons.globalState.auth = {
      isLoggedIn: Boolean(user),
      username: user?.username || null,
      userId: user?.id || null,
      xToken: user?.token || null,
      csrfToken,
      scratchLang,
    };
  } catch (error) {
    console.warn(
      'Scratch Addons: Unexpected session error:',
      error
    );

    resetAuthState();
  } finally {
    isChecking = false;
  }
}

/**
 * Handle a Scratch cookie change.
 */
const onCookiesChanged = (event) => {
  const { cookie } = event;

  if (!cookie) {
    return;
  }

  /*
   * Scratch language does not require a complete session check.
   */
  if (cookie.name === 'scratchlanguage') {
    void setLanguage();
    notify(cookie);

    return;
  }

  /*
   * If the cookie store is not known yet, determine it
   * without allowing an error to escape.
   */
  if (!scratchAddons.cookieStoreId) {
    void getDefaultStoreId()
      .then(() => checkSession())
      .catch((error) => {
        console.warn(
          'Scratch Addons: Failed to recover cookie store:',
          error
        );
      });

    notify(cookie);

    return;
  }

  /*
   * Ignore a CSRF event when the token did not actually change.
   */
  const sameCsrfToken =
    cookie.name === 'scratchcsrftoken' &&
    cookie.value ===
      scratchAddons.globalState.auth.csrfToken;

  if (
    cookie.storeId === scratchAddons.cookieStoreId &&
    !sameCsrfToken
  ) {
    void checkSession()
      .then(() => {
        if (cookie.name === 'scratchsessionsid') {
          try {
            startCache(
              scratchAddons.cookieStoreId,
              true
            );
          } catch (error) {
            console.warn(
              'Scratch Addons: Failed to restart message cache:',
              error
            );
          }

          try {
            purgeDatabase();
          } catch (error) {
            console.warn(
              'Scratch Addons: Failed to purge message database:',
              error
            );
          }
        }
      })
      .catch((error) => {
        console.warn(
          'Scratch Addons: Failed to process session change:',
          error
        );
      });

    notify(cookie);

    return;
  }

  /*
   * Clear the message cache for a different cookie store.
   */
  if (cookie.name === 'scratchsessionsid') {
    try {
      openMessageCache(cookie.storeId, true);
    } catch (error) {
      console.warn(
        'Scratch Addons: Failed to clear message cache:',
        error
      );
    }
  }

  notify(cookie);
};

/**
 * Process one queued cookie event.
 */
const processQueue = () => {
  if (queue.length === 0) {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    eventCount = 0;

    return;
  }

  const item = queue.shift();

  try {
    onCookiesChanged(item);
  } catch (error) {
    console.warn(
      'Scratch Addons: Failed to process cookie change:',
      error
    );
  }

  if (queue.length === 0 && timer !== null) {
    clearInterval(timer);
    timer = null;
    eventCount = 0;
  }
};

/**
 * Add a cookie event to the queue.
 */
const addToQueue = (item) => {
  const { cookie } = item;

  if (!cookie) {
    return;
  }

  const relevantCookie =
    cookie.name === 'scratchsessionsid' ||
    cookie.name === 'scratchlanguage' ||
    cookie.name === 'scratchcsrftoken';

  /*
   * Ignore unrelated cookies.
   */
  if (!relevantCookie) {
    return;
  }

  queue.push(item);
  eventCount++;

  /*
   * Prevent an unlimited queue during a cookie-change burst.
   */
  if (queue.length > MAX_COOKIE_QUEUE_SIZE) {
    queue.shift();
  }

  /*
   * Process the first few events immediately.
   */
  if (eventCount <= 5) {
    processQueue();
  }

  /*
   * Process remaining events at a controlled rate.
   */
  if (timer === null) {
    timer = setInterval(
      processQueue,
      COOKIE_CHANGE_RATE_LIMIT
    );
  }
};

/**
 * Listen for browser cookie changes.
 */
if (
  chrome.cookies?.onChanged &&
  typeof chrome.cookies.onChanged.addListener ===
    'function'
) {
  chrome.cookies.onChanged.addListener((event) => {
    try {
      addToQueue(event);
    } catch (error) {
      console.warn(
        'Scratch Addons: Failed to queue cookie change:',
        error
      );
    }
  });
}

/**
 * Notify Scratch Addons tabs about authentication changes.
 */
function notify(cookie) {
  if (!cookie) {
    return;
  }

  /*
   * Language changes do not require a session refetch.
   */
  if (cookie.name === 'scratchlanguage') {
    return;
  }

  const cond = {};

  /*
   * Firefox supports cookie-store-specific tabs.
   */
  if (isFirefox() && cookie.storeId) {
    cond.cookieStoreId = cookie.storeId;
  }

  if (
    !chrome.tabs ||
    typeof chrome.tabs.query !== 'function'
  ) {
    return;
  }

  chrome.tabs.query(cond, (tabs) => {
    if (chrome.runtime.lastError) {
      console.debug(
        'Scratch Addons: Could not query tabs:',
        chrome.runtime.lastError.message
      );

      return;
    }

    if (!Array.isArray(tabs)) {
      return;
    }

    for (const tab of tabs) {
      if (!tab?.id) {
        continue;
      }

      try {
        chrome.tabs.sendMessage(
          tab.id,
          'refetchSession',
          () => {
            /*
             * Some tabs do not contain a Scratch Addons
             * content script. Reading lastError prevents
             * Chrome from reporting an unchecked error.
             */
            void chrome.runtime.lastError;
          }
        );
      } catch (error) {
        /*
         * The tab can disappear between query() and
         * sendMessage().
         */
        console.debug(
          'Scratch Addons: Could not notify tab:',
          error
        );
      }
    }
  });

  /*
   * Notify Scratch Addons popups.
   */
  try {
    scratchAddons.sendToPopups({
      refetchSession: true,
    });
  } catch (error) {
    console.debug(
      'Scratch Addons: Could not notify popups:',
      error
    );
  }
}
