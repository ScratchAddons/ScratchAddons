chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getSettingsInfo") {
    sendResponse({
      manifests: scratchAddons.manifests,
      // Firefox breaks if we send proxies
      addonsEnabled: scratchAddons.localState._target.addonsEnabled,
      addonSettings: scratchAddons.globalState._target.addonSettings,
    });
  } else if (request.changeEnabledState) {
    const { addonId, newState } = request.changeEnabledState;
    scratchAddons.localState.addonsEnabled[addonId] = newState;
    chrome.storage.sync.set({
      addonsEnabled: scratchAddons.localState.addonsEnabled,
    });
    if (newState === false) {
      const addonObjs = scratchAddons.addons.filter((addonObj) => addonObj.self.id === addonId);
      if (addonObjs) addonObjs.forEach((addonObj) => addonObj._kill());
    } else {
      scratchAddons.runBgScriptsById(addonId);
    }
  } else if (request.changeAddonSettings) {
    console.log(request.changeAddonSettings);
    const { addonId, newSettings } = request.changeAddonSettings;
    scratchAddons.globalState.addonSettings[addonId] = newSettings;
    chrome.storage.sync.set({
      addonSettings: scratchAddons.globalState.addonSettings,
    });
  }
});
