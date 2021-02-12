import Listenable from "./Listenable.js";

/**
 * Manages settings.
 * @extends Listenable
 */
export default class Settings extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a setting.
   * @param {string} optionName - ID of the settings.
   * @throws settings ID is invalid.
   * @returns {*} setting.
   */
  get(optionName) {
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const value = settingsObj[optionName];
    if (value === undefined) throw "ScratchAddons exception: invalid setting ID";
    else return value;
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "settings";
  }
}
