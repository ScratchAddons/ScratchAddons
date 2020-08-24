chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    for (const { manifest, addonId } of scratchAddons.manifests) {
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
