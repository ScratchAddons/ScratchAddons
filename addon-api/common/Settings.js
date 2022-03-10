import Listenable from "./Listenable.js";

/** Manages settings. */
export default class Settings extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a setting.
   *
   * @param {string} optionName - ID of the settings.
   * @returns {any} Setting.
   * @throws Settings ID is invalid.
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
