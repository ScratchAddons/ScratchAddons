chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;

    for (const { manifest, addonId } of scratchAddons.manifests) {
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;
      if (manifest.settings) {
        if (addonId === "editor-dark-mode") {
          // Transition v1.12.0 modes to v1.13.0 presets

          // If user had a selected mode (AKA was a v1.12.0 user)
          // but has no "page" color set, do the transition
          // This will happen on first v1.13.0 run only
          if (settings.selectedMode && !settings.page) {
            const usePreset = (presetId) => {
              for (const option of manifest.settings) {
                if (option.id === "textShadow" && settings.textShadow !== undefined) {
                  // Exception: v1.12.0 already had this setting
                  // and we want to preserve what the user had
                  continue;
                }
                const presetValue = manifest.presets.find((preset) => preset.id === presetId).values[option.id];
                if (presetValue !== undefined) settings[option.id] = presetValue;
                else settings[option.id] = option.default; // TODO: make sure this is this what we want
              }
            };

            const previousMode = settings.selectedMode;
            if (previousMode === "3-darker") usePreset("3darker");
            else if (previousMode === "3-dark") usePreset("3dark");
            else if (previousMode === "dark-editor") usePreset("darkEditor");
            else if (previousMode === "experimental-dark") usePreset("experimentalDark");
            else {
              // Something went wrong, use 3.Darker
              usePreset("3darker");
            }

            addonSettings[addonId] = settings;
            madeAnyChanges = true;
            console.log("Migrated editor-dark-mode to presets");
            // Skip following code, continue with next addon
            continue;
          }
        }

        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;
            settings[option.id] = option.default;
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
