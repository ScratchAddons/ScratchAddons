chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    for (const addonId in scratchAddons.manifests) {
      const manifest = scratchAddons.manifests[addonId];
      const settings = addonSettings[addonId] || {};
      let madeChanges = false;
      if (manifest.options) {
        for (const option of manifest.options) {
          if (settings[option.id] === undefined) {
            madeChanges = true;
            settings[option.id] = option.default;
          }
        }
      }
      if (madeChanges) {
        console.log(`Changed settings for addon ${addonId}`);
        addonSettings[addonId] = settings;
      }
      if (addonsEnabled[addonId] === undefined) addonsEnabled[addonId] = !!manifest.enabled_by_default;
    }
    chrome.storage.sync.set({ addonSettings, addonsEnabled }, () => {
      scratchAddons.globalState.addonSettings = addonSettings;
      scratchAddons.localState.addonsEnabled = addonsEnabled;
      scratchAddons.localState.ready.addonSettings = true;
    });
  };
  window.addEventListener("manifestsready", func);
  if (scratchAddons.localState.ready.manifests) func();
});

// TODO: allow these to be called from the settings page. These are for testing.
window.updateAddonSettings = function updateAddonSettings(addonId, newSettings) {
  scratchAddons.globalState.addonSettings[addonId] = newSettings;
  chrome.storage.sync.set({
    addonSettings: scratchAddons.globalState.addonSettings,
  });
};
window.changeEnabledState = function changeEnabledState(addonId, newState) {
  scratchAddons.localState.addonsEnabled[addonId] = newState;
  chrome.storage.sync.set({
    addonsEnabled: scratchAddons.localState.addonsEnabled,
  });
  if (newState === false) {
    const addonObj = scratchAddons.addons.find((addonObj) => addonObj.self.id === addonId);
    if (addonObj) addonObj._kill();
  } else {
    scratchAddons.runBgScriptsById(addonId);
  }
};
