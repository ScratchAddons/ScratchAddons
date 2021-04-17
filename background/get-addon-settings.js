chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;

    for (const { manifest, addonId } of scratchAddons.manifests) {
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;
      if (addonId === "dango-rain" && typeof settings.force !== "undefined") {
        if (settings.force === false) {
          addonsEnabled[addonId] = false;
          console.log("Disabled dango-rain");
        }
        settings.force = undefined; // remove settings
        madeAnyChanges = true;
        madeChangesToAddon = true;
      }
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
                else settings[option.id] = option.default;
              }
            };

            const previousMode = settings.selectedMode;
            usePreset(
              {
                "3-darker": "3darker",
                "3-dark": "3dark",
                "dark-editor": "darkEditor",
                "experimental-dark": "experimentalDark",
              }[previousMode] || /* Something went wrong, use 3.Darker */ "3darker"
            );

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
          } else if (option.type === "positive_integer" || option.type === "integer") {
            // ^ else means typeof can't be "undefined", so it must be number
            if (typeof settings[option.id] !== "number") {
              // This setting was stringified, see #2142
              madeChangesToAddon = true;
              madeAnyChanges = true;
              const number = Number(settings[option.id]);
              // Checking if NaN just in case
              const newValue = Number.isNaN(number) ? option.default : number;
              settings[option.id] = newValue;
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
