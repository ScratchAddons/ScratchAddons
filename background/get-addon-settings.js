chrome.storage.sync.get(["addonSettings", "addonsEnabled"], ({ addonSettings = {}, addonsEnabled = {} }) => {
  const func = () => {
    let madeAnyChanges = false;

    if (addonsEnabled["editor-devtools"] === true && addonsEnabled["move-to-top-bottom"] === undefined) {
      // Existing editor-devtools users should have move-to-top-bottom enabled.
      addonsEnabled["move-to-top-bottom"] = true;
      madeAnyChanges = true;
    }

    for (const { manifest, addonId } of scratchAddons.manifests) {
      // TODO: we should be using Object.create(null) instead of {}
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;
      if (addonId === "project-info" && settings.editorCount) {
        madeChangesToAddon = madeAnyChanges = true;
        delete settings.editorCount;
        addonsEnabled["block-count"] = true;
      }
      if (manifest.settings) {
        if (
          addonId === "discuss-button" &&
          addonsEnabled["discuss-button"] === true &&
          (settings.buttonName || settings.removeIdeasBtn)
        ) {
          // Transition v1.22.0 modes to v1.23.0 settings
          madeChangesToAddon = true;
          madeAnyChanges = true;

          let option = manifest.settings.find((option) => option.id === "items");
          settings.items = [...option.default];
          settings.items.splice(3, 0, {
            name: settings.buttonName,
            url: "/discuss",
          });
          if (settings.removeIdeasBtn) settings.items.splice(2, 1);

          delete settings.removeIdeasBtn;
          delete settings.buttonName;
        }

        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;

            // cloning required for tables
            settings[option.id] = JSON.parse(JSON.stringify(option.default));
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
          } else if (option.type === "table") {
            const tableSettingIds = option.row.map((setting) => setting.id);
            settings[option.id].forEach((item, i) => {
              option.row.forEach((setting) => {
                if (item[setting.id] === undefined) {
                  madeChangesToAddon = true;
                  madeAnyChanges = true;
                  item[setting.id] = option.default[i][setting.id];
                }
              });
              for (const def in item) {
                if (!tableSettingIds.includes(def)) {
                  madeChangesToAddon = true;
                  madeAnyChanges = true;
                  delete item[def];
                }
              }
            });
          }
        }
      }

      if (addonsEnabled[addonId] === undefined) addonsEnabled[addonId] = !!manifest.enabledByDefault;

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
