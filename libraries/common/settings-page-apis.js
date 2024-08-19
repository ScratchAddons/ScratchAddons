import minifySettings from "./minify-settings.js";
const manifest = chrome.runtime.getManifest();

export const getPermissions = async () => chrome.permissions.getAll().then(({ permissions }) => permissions);
export const requestPermission = chrome.permissions.request;

export const getLanguage = chrome.i18n.getUILanguage;
export const getMessage = chrome.i18n.getMessage;

export const version = manifest.version;
export const versionName = manifest.version_name;

export const sendAddonStateChange = (addonId, newState) => {
  chrome.runtime.sendMessage({ changeEnabledState: { addonId, newState } });
};
export const sendAddonSettingChanges = (addonId, newSettings) => {
  chrome.runtime.sendMessage({ changeAddonSettings: { addonId, newSettings } });
};

export const reload = chrome.runtime.reload;

export const settingsPageURL = chrome.runtime.getURL(manifest.options_ui.page);

export const getForceEnglish = async () => {
  const { forceEnglish } = await chrome.storage.local.get("forceEnglish");
  return forceEnglish;
};
export const setForceEnglish = (forceEnglish) => chrome.storage.local.set({ forceEnglish });

export const getRunningAddons = () => {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (!tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, "getRunningAddons", { frameId: 0 }, (res) => {
        // Just so we don't get any errors in the console if we don't get any response from a non scratch tab.
        void chrome.runtime.lastError;
        const addonsCurrentlyOnTab = res ? [...res.userscripts, ...res.userstyles] : [];
        const addonsPreviouslyOnTab = res ? res.disabledDynamicAddons : [];
        resolve({ addonsCurrentlyOnTab, addonsPreviouslyOnTab });
      });
    });
  });
};

export const getSettingsInfo = (callback) => chrome.runtime.sendMessage("getSettingsInfo", callback);

export const getInstallType = async () => {
  const info = await chrome.management.getSelf();
  return info.installType;
};

export const sendPermissionCheck = () => chrome.runtime.sendMessage("checkPermissions");

export const getComponentURL = (filename, extention) => chrome.runtime.getURL(`${filename}.${extention}`);

export const getGlobalTheme = async () => {
  const { globalTheme = false } = await chrome.storage.sync.get(["globalTheme"]);
  return globalTheme;
};
export const setGlobalTheme = (globalTheme, callback) => {
  chrome.storage.sync.set({ globalTheme }, callback);
};

export const getAddonSettings = async () => {
  const storedSettings = await chrome.storage.sync.get(["addonSettings1", "addonSettings2", "addonSettings3"]);
  return {
    ...storedSettings.addonSettings1,
    ...storedSettings.addonSettings2,
    ...storedSettings.addonSettings3,
  };
};
export const setAddonSettings = (settings, manifests) => {
  chrome.storage.sync.set({ ...minifySettings(settings, manifests) });
};
export const getAddonEnabledStates = async () => {
  const { addonsEnabled } = await chrome.storage.sync.get("addonsEnabled");
  return addonsEnabled;
};
export const setAddonEnabledStates = (addonsEnabled) => {
  chrome.storage.sync.set({ addonsEnabled });
};

export const getReviewURL = () => {
  if (typeof browser !== "undefined") {
    return `https://addons.mozilla.org/en-US/firefox/addon/scratch-messaging-extension/reviews/`;
  } else {
    return `https://chrome.google.com/webstore/detail/scratch-addons/fbeffbjdlemaoicjdapfpikkikjoneco/reviews`;
  }
};

export const requestHostPermissions = () => {
  const manifest = chrome.runtime.getManifest();
  const origins = manifest.host_permissions.filter((url) => url.startsWith("https://"));
  return chrome.permissions.request({ origins });
};

export const checkAndOpenUnsupportedPage = () => {
  const checkIfUnsupported = () => {
    const getVersion = () => {
      let userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
      if (!userAgent) return { browser: null, version: null };
      return { browser: userAgent[1], version: userAgent[2].split(".")[0] };
    };

    let { browser, version } = getVersion();
    const MIN_CHROME_VERSION = 96;
    const MIN_FIREFOX_VERSION = 109;
    return (
      (browser === "Chrome" && version < MIN_CHROME_VERSION) || (browser === "Firefox" && version < MIN_FIREFOX_VERSION)
    );
  };

  if (checkIfUnsupported()) {
    const selfUrl = new URL(location.href);
    const isPopup = selfUrl.pathname.startsWith("/webpages/popup/");
    const urlToOpen = chrome.runtime.getURL("webpages/error/unsupported-browser.html");
    if (isPopup) chrome.tabs.create({ url: urlToOpen, active: true });
    else location.href = urlToOpen;
  }
}
