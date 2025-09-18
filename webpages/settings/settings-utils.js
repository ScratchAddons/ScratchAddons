import {
  getAddonEnabledStates,
  getAddonSettings,
  getGlobalTheme,
  requestPermission,
  setAddonEnabledStates,
  setAddonSettings,
  setGlobalTheme,
  versionName,
} from "../../libraries/common/settings-page-apis.js";

let handleConfirmClicked = null;

export const serializeSettings = async () => {
  const [globalTheme, addonSettings, addonsEnabled] = await Promise.all([
    getGlobalTheme(),
    getAddonSettings(),
    getAddonEnabledStates(),
  ]);

  const serialized = {
    core: {
      lightTheme: globalTheme,
      version: versionName,
    },
    addons: {},
  };
  for (const addonId of Object.keys(addonsEnabled)) {
    serialized.addons[addonId] = {
      enabled: addonsEnabled[addonId],
      settings: addonSettings[addonId] || {},
    };
  }
  return JSON.stringify(serialized);
};

export const deserializeSettings = async (str, manifests, confirmElem, { browserLevelPermissions }) => {
  const obj = JSON.parse(str);
  const [addonSettings, addonsEnabled] = await Promise.all([getAddonSettings(), getAddonEnabledStates()]);

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
      const granted = await requestPermission({
        permissions: Object.values(pendingPermissions).flat(),
      });
      Object.keys(pendingPermissions).forEach((addonId) => {
        addonsEnabled[addonId] = granted;
      });
    }
    const prerelease = versionName.endsWith("-prerelease");
    setGlobalTheme(!!obj.core.lightTheme);
    setAddonEnabledStates(addonsEnabled);
    setAddonSettings(addonSettings, prerelease ? null : manifests);
    resolvePromise();
  };
  confirmElem.classList.remove("hidden-button");
  confirmElem.addEventListener("click", handleConfirmClicked, { once: true });
  return resolveOnConfirmPromise;
};
