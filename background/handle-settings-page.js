import changeAddonState from "./imports/change-addon-state.js";

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
    const { addonId, newSettings } = request.changeAddonSettings;
    const addonSettings = Object.assign({}, scratchAddons.globalState.addonSettings, {
      [addonId]: newSettings,
    });
    chrome.storage.sync.set({
      addonSettings: newSettings,
    });
  }
});
