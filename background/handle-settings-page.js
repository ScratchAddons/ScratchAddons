import runPersistentScripts from "./imports/run-persistent-scripts.js";

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
    scratchAddons.localState.addonsEnabled[addonId] = newState;
    chrome.storage.sync.set({
      addonsEnabled: scratchAddons.localState.addonsEnabled,
    });
    chrome.tabs.query({}, (tabs) => {
      // Tabs with urls means that ScratchAddons has perms there
      tabs = tabs.filter((tab) => tab.url);
      for (let tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { newAddonState: { addonId, newState } });
      }
    });
    if (newState === false) {
      const addonObjs = scratchAddons.addonObjects.filter((addonObj) => addonObj.self.id === addonId);
      if (addonObjs) addonObjs.forEach((addonObj) => addonObj._kill());
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
    } else {
      runPersistentScripts(addonId);
    }

    if (scratchAddons.manifests.find((obj) => obj.addonId === addonId).manifest.tags.includes("theme"))
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("themesUpdated"));
  } else if (request.changeAddonSettings) {
    const { addonId, newSettings } = request.changeAddonSettings;
    scratchAddons.globalState.addonSettings[addonId] = newSettings;
    chrome.storage.sync.set({
      addonSettings: scratchAddons.globalState.addonSettings,
    });

    if (scratchAddons.manifests.find((obj) => obj.addonId === addonId).manifest.tags.includes("theme"))
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("themesUpdated"));
  }
});
