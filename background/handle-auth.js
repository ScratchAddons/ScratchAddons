const CHROME_DEFAULT_STORE = "0";
const FIREFOX_DEFAULT_STORE = "firefox-default";

async function getDefaultStoreId() {
  try {
    if (
      !chrome.cookies ||
      typeof chrome.cookies.getAllCookieStores !== "function"
    ) {
      return null;
    }

    const stores = await chrome.cookies.getAllCookieStores();

    if (!Array.isArray(stores) || stores.length === 0) {
      return null;
    }

    // Normal Chrome store
    const chromeStore = stores.find(
      store => store && store.id === "0"
    );

    if (chromeStore) {
      scratchAddons.cookieStoreId = chromeStore.id;
      return chromeStore.id;
    }

    // Normal Firefox store
    const firefoxStore = stores.find(
      store => store && store.id === "firefox-default"
    );

    if (firefoxStore) {
      scratchAddons.cookieStoreId = firefoxStore.id;
      return firefoxStore.id;
    }

    // Any valid store
    const firstStore = stores.find(
      store => store && typeof store.id === "string"
    );

    if (firstStore) {
      scratchAddons.cookieStoreId = firstStore.id;
      return firstStore.id;
    }

    return null;
  } catch (error) {
    return null;
  }
}
