export const OLD_ADDON_SETTINGS_KEY = "addonSettings";
export const ADDON_SETTINGS_KEYS = ["addonSettings1", "addonSettings2", "addonSettings3"];
export const ADDONS_ENABLED_KEY = "addonsEnabled";

/**
 Since presets can change independently of others, we have to keep track of
 the versions separately. Current versions:

 - editor-dark-mode 10 (bumped 4 times in v1.33.2)
 - editor-theme3 3 (last bumped in v1.32)
 - dark-www 7 (bumped twice in v1.34.0)
 - forum-quote-code-beautifier 1 (last bumped in v1.34)
 */

// The following three functions are helper functions for the setting migration code
const areColorsEqual = (currentColor, oldPresetColor) => {
  // Converts  three/four/six value syntax into eight value syntax
  const getRRGGBBAA = (hexColor) =>
    hexColor.length === 7 // #{rr}{gg}{bb}  →  #{rr}{gg}{bb}ff
      ? `${hexColor}ff`
      : hexColor.length === 5 // #{r}{g}{b}{a}  →  #{rr}{gg}{bb}{aa}
      ? `#${hexColor[1].repeat(2)}${hexColor[2].repeat(2)}${hexColor[3].repeat(2)}${hexColor[4].repeat(2)}`
      : hexColor.length === 4 // #{r}{g}{b}  →  #{rr}{gg}{bb}ff
      ? `#${hexColor[1].repeat(2)}${hexColor[2].repeat(2)}${hexColor[3].repeat(2)}ff`
      : hexColor;

  // Convert color to #{rr}{gg}{bb}{aa}
  const normalizeColor = (color) => getRRGGBBAA(color.toLowerCase());

  return normalizeColor(currentColor) === normalizeColor(oldPresetColor);
};

const areSettingsEqual = (currentValue, oldPresetValue) => {
  if (typeof oldPresetValue === "string" && oldPresetValue.startsWith("#")) {
    // We assume this is a color setting.
    if (typeof currentValue === "string") return areColorsEqual(currentValue, oldPresetValue);
  }
  return currentValue === oldPresetValue;
};

export const transitionToNewStorageKeys = async (addonSettings) => {
  await chrome.storage.sync.set({
    ...minifySettings(addonSettings, null),
    addonSettingsOld: addonSettings,
  });
  await chrome.storage.sync.remove("addonSettings");
  setTimeout(() => chrome.runtime.reload(), 500);
};

const AddonStates = Object.freeze({
  new: undefined,
  enabled: true,
  disabled: false,
});

export const createContext = (addonsEnabled, settings) => {
  let madeAnyChanges = false;
  return {
    /**
     * get/set the addon state
     * @param {string} id addon id
     * @param {keyof AddonStates} newValue new enabled value (true/false)
     * @returns {keyof AddonStates}
     */
    addonState(id, newValue) {
      const storageValue = addonsEnabled[id];
      const state = Object.keys(AddonStates).find((s) => AddonStates[s] === storageValue);
      if (newValue) {
        if (newValue !== state) return;
        madeAnyChanges = true;
        addonsEnabled[id] = AddonStates[newValue];
        return;
      }
      return state;
    },
    /**
     * get/set/remove addon setting
     * @param {string} id addon id
     * @param {string} setting setting id
     * @param {{ remove: boolean, set: any }} options
     * @returns {any}
     */
    addonSetting(id, setting, { remove, set } = {}) {
      if (typeof set !== "undefined") {
        if (!settings[id]) settings[id] = Object.create(null);
        settings[id][setting] = set;
        madeAnyChanges = true;
      }
      if (!settings[id]) return;
      if (remove) {
        delete settings[id][setting];
        madeAnyChanges = true;
      }
      return settings[id][setting];
    },
    /**
     * use addonSetting() in context of an addon id.
     * @param {string} id addon id
     */
    createSettingsContext(id) {
      // True, yes, you can use ".bind" here, but it removes the infered/explicit typing which I don't like.
      let changesMade = false;
      /**
       * get/set/remove addon setting
       * @param {string} setting setting id
       * @param {{ remove: boolean, set: any }} options
       * @returns {any}
       */
      const setting = (setting, { remove, set } = {}) => {
        if (set) changesMade = true;
        return this.addonSetting(id, setting, { remove, set });
      };
      return {
        setting,
        updatePresetIfMatching(version, oldPreset = null, presetOrFn = null) {
          if ((setting("_version") || 0) < version) {
            /**
              Version must be set even if transition is unnecessary;
              1) User uses custom settings
              2) User updates, transition aborts
              3) User changes settings to old preset values
              4) Without version, this change will revert after reload!

              Therefore, DO NOT REMOVE CALLS TO THIS METHOD. Instead omit oldPreset and preset
              when transition is no longer necessary.
             */
            setting("_version", version);
            if (presetOrFn === null) return;
            const map = {};
            for (const key of Object.keys(oldPreset)) {
              if (!areSettingsEqual(setting(key), oldPreset[key])) return;
              if (typeof presetOrFn === "object") map[key] = presetOrFn.values[key];
            }

            const appliedVersions = setting("_appliedVersions");
            if (Array.isArray(appliedVersions)) {
              appliedVersions.push(version);
              setting("_appliedVersions", { set: appliedVersions });
            } else setting("_appliedVersions", { set: [version] });
            if (typeof presetOrFn === "function") return presetOrFn(); // Custom migration logic if preset matches

            const preset = presetOrFn;

            // For newly added keys
            for (const key of Object.keys(preset.values).filter(
              (k) => !Object.prototype.hasOwnProperty.call(oldPreset, k)
            )) {
              map[key] = preset.values[key];
            }
            // TODO: this is using an old variable, that needs to get updated
            Object.assign(settings, map);
          }
        },

        get changesMade() {
          return changesMade;
        },
      };
    },

    get madeChanges() {
      return madeAnyChanges;
    },
  };
};
