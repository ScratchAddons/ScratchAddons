import changeAddonState from "./imports/change-addon-state.js";
import minifySettings from "../libraries/common/minify-settings.js";
import { updateBadge } from "./message-cache.js";
import { onReady } from "./imports/on-ready.js";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Message used to load popups as well
  if (request === "getSettingsInfo") {
    return onReady(() => {
      sendResponse({
        manifests: scratchAddons.manifests,
        // Firefox breaks if we send proxies
        addonsEnabled: scratchAddons.localState._target.addonsEnabled,
        addonSettings: scratchAddons.globalState._target.addonSettings,
      });
    });
  } else if (request.changeEnabledState) {
    return onReady(() => {
      const { addonId, newState } = request.changeEnabledState;
      changeAddonState(addonId, newState);
    });
  } else if (request.changeAddonSettings) {
    return onReady(() => {
      const { addonId, newSettings } = request.changeAddonSettings;
      scratchAddons.globalState.addonSettings[addonId] = newSettings;
      const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
      chrome.storage.sync.set({
        // Store target so arrays don't become objects
        ...minifySettings(scratchAddons.globalState.addonSettings._target, prerelease ? null : scratchAddons.manifests),
      });

      const manifest = scratchAddons.manifests.find((addon) => addon.addonId === addonId).manifest;
      const { updateUserstylesOnSettingsChange } = manifest;
      if (updateUserstylesOnSettingsChange)
        scratchAddons.localEvents.dispatchEvent(
          new CustomEvent("updateUserstylesSettingsChange", { detail: { addonId, manifest, newSettings } })
        );
      if (addonId === "msg-count-badge") updateBadge(scratchAddons.cookieStoreId);
    });
  }
});
