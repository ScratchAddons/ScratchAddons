import minifySettings from "../libraries/common/minify-settings.js";

/**
 Since presets can change independently of others, we have to keep track of
 the versions separately. Current versions:

 - editor-dark-mode 2 (bumped in v1.23 twice)
 */

const updatePresetIfMatching = (settings, version, oldPreset = null, preset = null) => {
  if ((settings._version || 0) < version) {
    /**
     Version must be set even if transition is unnecessary;
     1) User uses custom settings
     2) User updates, transition aborts
     3) User changes settings to old preset values
     4) Without version, this change will revert after reload!

     Therefore, DO NOT REMOVE CALLS TO THIS METHOD. Instead omit oldPreset and preset
     when transition is no longer necessary.
     */
    settings._version = version;
    if (preset === null) return;
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

    if (addonSettings["editor-dark-mode"]?.textShadow === true && addonsEnabled["custom-block-text"] === undefined) {
      // Transition v1.23 to v1.24
      // Moved text shadow option to the custom-block-text addon
      madeAnyChanges = true;
      delete addonSettings["editor-dark-mode"].textShadow;
      addonsEnabled["custom-block-text"] = addonsEnabled["editor-dark-mode"];
      addonSettings["custom-block-text"] = { shadow: true };
      // `shadow` isn't the only setting - the other setting, `bold`, is set
      // to its default (false) inside the for loop below.
    }

    if (addonsEnabled["editor-devtools"] === false) {
      // Transition 1.27.0 to 1.28.0
      // Disable addons previously part of devtools, if devtools is disabled
      if (addonsEnabled["find-bar"] === undefined) {
        madeAnyChanges = true;
        addonsEnabled["find-bar"] = false;
      }
      if (addonsEnabled["jump-to-def"] === undefined) {
        madeAnyChanges = true;
        addonsEnabled["jump-to-def"] = false;
      }
    }

    for (const { manifest, addonId } of scratchAddons.manifests) {
      // TODO: we should be using Object.create(null) instead of {}
      const settings = addonSettings[addonId] || {};
      let madeChangesToAddon = false;

      if (addonId === "editor-dark-mode") {
        // Transition v1.27 to v1.28
        // editor-dark-mode enabled opacity to the block pallete.
        // We append "cc" to the color so that it's the same as before this update.
        if (settings.palette !== undefined && settings.palette.length === 7) {
          settings.palette += "cc";
          madeAnyChanges = madeChangesToAddon = true;
        }
      }

      if (manifest.settings) {
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

        if (addonId === "editor-dark-mode") updatePresetIfMatching(settings, 2);
      }

      if (addonsEnabled[addonId] === undefined) addonsEnabled[addonId] = !!manifest.enabledByDefault;

      if (madeChangesToAddon) {
        console.log(`Changed settings for addon ${addonId}`);
        addonSettings[addonId] = settings; // In case settings variable was a newly created object
      }
    }

    const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
    if (madeAnyChanges)
      chrome.storage.sync.set({
        addonSettings: minifySettings(addonSettings, prerelease ? null : scratchAddons.manifests),
        addonsEnabled,
      });
    scratchAddons.globalState.addonSettings = addonSettings;
    scratchAddons.localState.addonsEnabled = addonsEnabled;
    scratchAddons.localState.ready.addonSettings = true;
  };

  if (scratchAddons.localState.ready.manifests) func();
  else scratchAddons.localEvents.addEventListener("manifestsReady", func);
});
