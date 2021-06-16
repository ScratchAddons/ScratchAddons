chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;

    for (const { manifest, addonId } of scratchAddons.manifests) {
      // TODO: we should be using Object.create(null) instead of {}
      // const settings = addonSettings[addonId] || {};
      let settings = {};
      let madeChangesToAddon = false;
      if (manifest.settings) {
        if (addonId === "discuss-button" && typeof settings.buttonName !== "undefined") {
          // Transition v1.16.0 modes to v1.17.0 settings
          madeChangesToAddon = true;
          madeAnyChanges = true;

          let option = manifest.settings.find((option) => option.id === "items");
          settings.items = option.default;
          if (settings.removeIdeasBtn) settings.items.splice(2, 1);
          settings.items.push([settings.buttonName, "/discuss"]);

          //todo use other
          settings.items = settings.items.map((defaultValues) =>
            defaultValues.map((defaultValue, i) => ({ ...option.row[i], default: defaultValue }))
          );
          delete settings.removeIdeasBtn;
          delete settings.buttonName;
        }

        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;
            settings[option.id] = option.default;
            if (option.type === "table") {
              settings[option.id] = settings[option.id].map((defaultValues) => {
                let info = {};
                defaultValues.forEach((defaultValue, i) => (info[option.row[i].id] = defaultValue));
                return info;
              });
              console.log(settings);
            }
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

      if (addonsEnabled[addonId] === undefined) addonsEnabled[addonId] = !!manifest.enabledByDefault;
      else if (addonId === "dango-rain") {
        if (typeof settings.force !== "undefined") {
          if (settings.force === false) {
            // Note: addon might be disabled already, but we don't care
            addonsEnabled[addonId] = false;
            console.log("Disabled dango-rain because force was disabled");
          }
          delete settings.force; // Remove setting so that this only happens once
          madeChangesToAddon = true;
          madeAnyChanges = true;
        }
      }

      if (madeChangesToAddon) {
        console.log(`Changed settings for addon ${addonId}`);
        addonSettings[addonId] = settings; // In case settings variable was a newly created object
      }
    }

    if (madeAnyChanges) chrome.storage.sync.set({ addonSettings, addonsEnabled });
    scratchAddons.globalState.addonSettings = addonSettings;
    scratchAddons.localState.addonsEnabled = addonsEnabled;
    scratchAddons.localState.ready.addonSettings = true;
  };

  if (scratchAddons.localState.ready.manifests) func();
  else scratchAddons.localEvents.addEventListener("manifestsReady", func);
});
