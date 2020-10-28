chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;
    for (const { manifest, addonId } of scratchAddons.manifests) {
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;
      if (manifest.settings) {
        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;

            // TODO: remove on v1.3.0
            // Switches everyone with disabled dark mode to 3.Darker (new default)
            // Turns on text shadows for dark mode enabled users currently on Dark editor (default would be false)
            if (
              addonId === "editor-dark-mode" &&
              option.id === "textShadow" &&
              chrome.runtime.getManifest().version.startsWith("1.2")
            ) {
              // Note: addonsEnabled["editor-dark-mode"] is undefined if it's the first extension run ever
              if (addonsEnabled["editor-dark-mode"] === false) {
                settings.selectedMode = "3.Darker";
                settings.textShadow = false;
              } else if (addonsEnabled["editor-dark-mode"] === true) {
                if (settings.selectedMode === "Dark editor") settings.textShadow = true;
                else settings.textShadow = false;
              } else {
                settings[option.id] = option.default;
              }
            } else {
              settings[option.id] = option.default;
            }
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
