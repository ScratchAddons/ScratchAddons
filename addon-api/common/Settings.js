import Listenable from "./Listenable.js";

/**
 * Manages settings.
 */
export default class Settings extends Listenable {
  constructor(addonObject) {
    super();
    /** @private */
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a setting.
   * @param {string} optionName ID of the setting.
   * @throws If the setting ID is invalid.
   * @returns {*} The setting.
   */
  get(optionName) {
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const value = settingsObj[optionName];
    if (value === undefined) throw "ScratchAddons exception: invalid setting ID";
    else return value;
  }
  /** @private */
  get _eventTargetKey() {
    return "settings";
  }
}
