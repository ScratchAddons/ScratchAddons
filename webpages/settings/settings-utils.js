import minifySettings from "../../libraries/common/minify-settings.js";

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

let handleConfirmClicked = null;

export const serializeSettings = async () => {
  const syncGet = promisify(chrome.storage.sync.get.bind(chrome.storage.sync));
  const storedSettings = await syncGet([
    "globalTheme",
    "addonSettings1",
    "addonSettings2",
    "addonSettings3",
    "addonsEnabled",
  ]);
  const addonSettings = {
    ...storedSettings.addonSettings1,
    ...storedSettings.addonSettings2,
    ...storedSettings.addonSettings3,
  };
  const serialized = {
    core: {
      lightTheme: storedSettings.globalTheme,
      version: chrome.runtime.getManifest().version_name,
    },
    addons: {},
  };
  for (const addonId of Object.keys(storedSettings.addonsEnabled)) {
    serialized.addons[addonId] = {
      enabled: storedSettings.addonsEnabled[addonId],
      settings: addonSettings[addonId] || {},
    };
  }
  return JSON.stringify(serialized);
};

export const deserializeSettings = async (str, manifests, confirmElem, { browserLevelPermissions }) => {
  const obj = JSON.parse(str);
  const syncGet = promisify(chrome.storage.sync.get.bind(chrome.storage.sync));
  const syncSet = promisify(chrome.storage.sync.set.bind(chrome.storage.sync));
  const { addonsEnabled, ...storageItems } = await syncGet([
    "addonSettings1",
    "addonSettings2",
    "addonSettings3",
    "addonsEnabled",
  ]);
  const addonSettings = {
    ...storageItems.addonSettings1,
    ...storageItems.addonSettings2,
    ...storageItems.addonSettings3,
  };
  const pendingPermissions = {};
  for (const addonId of Object.keys(obj.addons)) {
    const addonValue = obj.addons[addonId];
    const addonManifest = manifests.find((m) => m._addonId === addonId);
    if (!addonManifest) continue;
    const permissionsRequired = addonManifest.permissions || [];
    const browserPermissionsRequired = permissionsRequired.filter((p) => browserLevelPermissions.includes(p));
    if (addonValue.enabled && browserPermissionsRequired.length) {
      pendingPermissions[addonId] = browserPermissionsRequired;
    } else {
      addonsEnabled[addonId] = addonValue.enabled;
    }
    addonSettings[addonId] = Object.assign({}, addonSettings[addonId]);
    delete addonSettings[addonId]._version;
    Object.assign(addonSettings[addonId], addonValue.settings);
  }
  if (handleConfirmClicked) confirmElem.removeEventListener("click", handleConfirmClicked, { once: true });
  let resolvePromise = null;
  const resolveOnConfirmPromise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  handleConfirmClicked = async () => {
    handleConfirmClicked = null;
    if (Object.keys(pendingPermissions).length) {
      const granted = await promisify(chrome.permissions.request.bind(chrome.permissions))({
        permissions: Object.values(pendingPermissions).flat(),
      });
      Object.keys(pendingPermissions).forEach((addonId) => {
        addonsEnabled[addonId] = granted;
      });
    }
    const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
    await syncSet({
      globalTheme: !!obj.core.lightTheme,
      addonsEnabled,
      ...minifySettings(addonSettings, prerelease ? null : manifests),
    });
    resolvePromise();
  };
  confirmElem.classList.remove("hidden-button");
  confirmElem.addEventListener("click", handleConfirmClicked, { once: true });
  return resolveOnConfirmPromise;
};
