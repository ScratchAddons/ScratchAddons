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
   * Changes the addon's settings.
   * @param {{ [key: string]: any }} settings - The setting IDs and their new values.
   * @throws Setting can't be set or has an invalid value.
   * @returns {Promise<void>}
   */
  async change(settings) {
    const response = await scratchAddons.methods.updateAddonSettings(this._addonId, settings);
    if ("error" in response) throw response.error;
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "settings";
  }
}
