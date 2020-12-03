chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;

    // Used to map old name to new ID
    const oldToNewMap = {
      "3.Dark": "3-dark",
      "3.Darker": "3-darker",
      "Dark Editor": "dark-editor",
      "Dark WWW": "dark-www",
      TurboWarp: "turbowarp",
      Silent: "silent",
      "System default": "system-default",
      "Scratch Addons ping": "addons-ping",
    };

    for (const { manifest, addonId } of scratchAddons.manifests) {
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;
      if (manifest.settings) {
        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;
            settings[option.id] = option.default;
          }
          // TODO: remove in v1.5.0
          if (option.type === "select" && oldToNewMap.hasOwnProperty(settings[option.id])) {
            settings[option.id] = oldToNewMap[settings[option.id]];
            madeChangesToAddon = madeAnyChanges = true;
          }
        }
      }
      if (madeChangesToAddon) {
        console.log(`Changed settings for addon ${addonId}`);
        addonSettings[addonId] = settings;
      }
      if (addonsEnabled[addonId] === undefined) addonsEnabled[addonId] = !!manifest.enabledByDefault;
    }
    if (madeAnyChanges) chrome.storage.sync.set({ addonSettings, addonsEnabled });
    scratchAddons.globalState.addonSettings = addonSettings;
    scratchAddons.localState.addonsEnabled = addonsEnabled;
    scratchAddons.localState.ready.addonSettings = true;
  };

  if (scratchAddons.localState.ready.manifests) func();
  else scratchAddons.localEvents.addEventListener("manifestsReady", func);
});
