import changeAddonState from "./imports/change-addon-state.js";
import minifySettings from "../libraries/common/minify-settings.js";
import { updateBadge } from "./message-cache.js";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Message used to load popups as well
  if (request === "getSettingsInfo") {
    const sendRes = () =>
      sendResponse({
        manifests: scratchAddons.manifests,
        // Firefox breaks if we send proxies
        addonsEnabled: scratchAddons.localState._target.addonsEnabled,
        addonSettings: scratchAddons.globalState._target.addonSettings,
      });
    // Data might have not loaded yet, or be partial.
    // Only respond when all data is ready
    if (scratchAddons.localState.allReady) {
      sendRes();
    } else {
      scratchAddons.localEvents.addEventListener("ready", sendRes);
      return true;
    }
  } else if (request.changeEnabledState) {
    const { addonId, newState } = request.changeEnabledState;
    changeAddonState(addonId, newState);
  } else if (request.changeAddonSettings) {
    const { addonId, newSettings, fromPage } = request.changeAddonSettings;
    if (!fromPage) {
      // Validate the new value to prevent issues.
      const addonSettings =
        scratchAddons.manifests.find(({ addonId: manifestAddon }) => manifestAddon === addonId)?.manifest.settings ||
        [];
      for (const settingId in newSettings) {
        if (Object.prototype.hasOwnProperty.call(newSettings, settingId)) {
          const settingDef = addonSettings.find((setting) => setting.id === settingId);
          if (!settingDef) {
            return sendResponse({
              error: "Invalid setting ID",
            });
          }
          if (!settingDef.userscriptsCanSet) {
            return sendResponse({
              error: "Cannot change that setting programmatically.",
            });
          }

          function isValid(settingDef, value) {
            switch (settingDef.type) {
              case "boolean":
                return typeof value === "boolean";
              case "string":
              case "untranslated":
                return (
                  typeof value === "string" &&
                  value.length >= (settingDef.min ?? 0) &&
                  value.length <= (settingDef.max ?? Infinity)
                );
              case "integer":
                return typeof value === "number" && Math.round(value) === value;
              case "positive_integer":
                return typeof value === "number" && Math.round(value) === value && value >= 0;
              case "color":
                return (
                  typeof value === "string" &&
                  (settingDef.allowTransparency ? /^#([0-9a-fA-F]{2}){1,4}$/ : /^#([0-9a-fA-F]{2}){1,3}$/).test(value)
                );
              case "select":
                return settingDef.potentialValues
                  .map((potv) => (typeof potv === "object" ? potv.id : potv))
                  .includes(value);
              case "table":
                return value.every((value) => settingDef.row.every((item) => isValid(item, value[item.id])));
              default:
                return false;
            }
          }

          const settingValid = isValid(settingDef, newSettings[settingId]);

          if (!settingValid) {
            return sendResponse({
              error: `Invalid value for setting ${settingId}`,
            });
          }
        }
      }
    }
    Object.assign(scratchAddons.globalState.addonSettings[addonId], newSettings);
    const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
    chrome.storage.sync.set({
      // Store target so arrays don't become objects
      addonSettings: minifySettings(
        scratchAddons.globalState.addonSettings._target,
        prerelease ? null : scratchAddons.manifests
      ),
    });

    const manifest = scratchAddons.manifests.find((addon) => addon.addonId === addonId).manifest;
    const { updateUserstylesOnSettingsChange } = manifest;
    if (updateUserstylesOnSettingsChange)
      scratchAddons.localEvents.dispatchEvent(
        new CustomEvent("updateUserstylesSettingsChange", {
          detail: { addonId, manifest, newSettings },
        })
      );
    if (addonId === "msg-count-badge") updateBadge(scratchAddons.cookieStoreId);
    if (!fromPage) sendResponse({});
  }
});
