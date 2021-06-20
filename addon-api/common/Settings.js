import Listenable from "./Listenable.js";

/** Manages settings. */
export default class Settings extends Listenable {
  /** @param {any} addonObject */
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a setting.
   *
   * @param {string} optionName - ID of the settings.
   *
   * @returns {any} Setting.
   * @throws Settings ID is invalid.
   */
  get(optionName) {
    /** @type {{ [key: string]: string | boolean | number }} */
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const value = settingsObj[optionName];
    if (value === undefined) throw "ScratchAddons exception: invalid setting ID";
    else return value;
  }

  /** @type {"settings"} */
  get _eventTargetKey() {
    return "settings";
  }
}
