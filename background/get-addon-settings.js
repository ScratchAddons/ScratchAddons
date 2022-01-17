/**
 Since presets can change independently of others, we have to keep track of
 the versions separately. Current versions:

 - editor-dark-mode 2 (bumped in v1.23 twice)
 */

const updatePresetIfMatching = (preset, settings, oldPreset, version) => {
  if ((settings._version || 0) < version) {
    /**
     Version must be set even if transition is unnecessary;
     1) User uses custom settings
     2) User updates, transition aborts
     3) User changes settings to old preset values
     4) Without version, this change will revert after reload!
     */
    settings._version = version;
    const map = {};
    for (const key of Object.keys(oldPreset)) {
      if (settings[key] !== oldPreset[key]) return;
      map[key] = preset.values[key];
    }
    Object.assign(settings, map);
  }
};

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
        // Transition v1.22 to v1.23
        // project-info was split into 2 addons
        madeChangesToAddon = madeAnyChanges = true;
        delete settings.editorCount;
        addonsEnabled["block-count"] = true;
      }
      if (addonId === "editor-dark-mode") {
        // Transition v1.22 to v1.23
        // TurboWarp Dark preset changes:
        updatePresetIfMatching(
          manifest.presets.find((p) => p.id === "tw-dark"),
          settings,
          {
            page: "#111111",
            primary: "#ff4d4d",
            highlightText: "#ff4d4d",
            menuBar: "#333333",
            activeTab: "#1e1e1e",
            tab: "#2e2e2e",
            selector: "#1e1e1e",
            selector2: "#2e2e2e",
            selectorSelection: "#111111",
            accent: "#111111",
            input: "#1e1e1e",
            workspace: "#1e1e1e",
            categoryMenu: "#111111",
            palette: "#111111",
            fullscreen: "#111111",
            stageHeader: "#111111",
            border: "#ffffff0d",
          },
          1
        );
        // Experimental Dark changes:
        updatePresetIfMatching(
          manifest.presets.find((p) => p.id === "experimentalDark"),
          settings,
          {
            page: "#001533",
            primary: "#4d97ff",
            highlightText: "#4d97ff",
            menuBar: "#4d97ff",
            activeTab: "#282828",
            tab: "#192f4d",
            selector: "#030b16",
            selector2: "#192f4d",
            selectorSelection: "#282828",
            accent: "#282828",
            input: "#282828",
            workspace: "#282828",
            categoryMenu: "#282828",
            palette: "#333333",
            fullscreen: "#282828",
            stageHeader: "#333333",
            border: "#444444",
          },
          2
        );
      }
      if (manifest.settings) {
        for (const option of manifest.settings) {
          if (settings[option.id] === undefined) {
            madeChangesToAddon = true;
            madeAnyChanges = true;
            // Transition v1.16.5 to v1.17.0
            // Users of scratchr2 addon will get "scratchr2" version of old-studio-layout
            if (addonId === "old-studio-layout" && option.id === "version" && addonsEnabled.scratchr2) {
              settings.version = "scratchr2";
              continue;
            }
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
        if (addonId === "dark-www") {
          // Transition v1.22.0 to v1.23.0
          const scratchr2 = addonSettings.scratchr2 || {};
          if (
            (typeof scratchr2.primaryColor === "string" && scratchr2.primaryColor !== "#4d97ff") ||
            (typeof scratchr2.linkColor === "string" && scratchr2.linkColor !== "#4d97ff")
          ) {
            if (addonsEnabled["dark-www"] !== true) {
              addonsEnabled["dark-www"] = addonsEnabled.scratchr2 === true;
              Object.assign(settings, manifest.presets.find((preset) => preset.id === "scratch").values);
            }
            madeAnyChanges = madeChangesToAddon = true;
            if (typeof scratchr2.primaryColor === "string") settings.navbar = settings.button = scratchr2.primaryColor;
            if (typeof scratchr2.linkColor === "string") settings.link = scratchr2.linkColor;
            delete scratchr2.primaryColor;
            delete scratchr2.linkColor;
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
