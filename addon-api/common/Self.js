import Listenable from "./Listenable.js";

/**
 * Represents information about the addon.
 *
 */
export default class Self extends Listenable {
  constructor(addonObj, info) {
    super();
    /** @private */
    this._addonId = info.id; // In order to receive fireEvent messages from background
    /**
     * The addon ID for this addon.
     */
    this.id = info.id;
    /** @private */
    this._addonObj = addonObj;
    // catches both Chrome and Chromium
    /**
     * The browser Scratch Addons is running on.
     */
    this.browser = /Chrom/.test(navigator.userAgent) ? "chrome" : "firefox";
    /**
     * Whether the addon is currently disabled or not.
     */
    this.disabled = false;
    /**
     * Whether the running userscript was injected dynamically in response to the user enabling the addon.
     */
    this.enabledLate = false;
    this.addEventListener("disabled", () => (this.disabled = true));
    this.addEventListener("reenabled", () => (this.disabled = false));
  }

  /**
   Path to the addon's directory.
   * @type {string}
   */
  get dir() {
    return `${this._addonObj._path}addons/${this.id}`;
  }

  /** @private */
  get _eventTargetKey() {
    return "self";
  }

  /**
   * Gets a list of addon IDs enabled, optionally filtered using tags.
   * @param {string=} tag The tag for filtering.
   * @returns {Promise<string[]>} Enabled addons' IDs.
   */
  getEnabledAddons(tag) {
    return scratchAddons.methods.getEnabledAddons(tag);
  }
}
