import Listenable from "./Listenable.js";

/**
 * Represents information about the addon.
 */
export default class Self extends Listenable {
  constructor(addonObj, info) {
    super();
    this._addonId = info.id; // In order to receive fireEvent messages from background
    /**
     * The addon's ID.
     *
     * @type {string}
     */
    this.id = info.id;
    this._addonObj = addonObj;
    /**
     * The browser.
     *
     * @type {string}
     */
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
    /**
     * Whether the addon is disabled or not.
     *
     * @type {boolean}
     */
    this.disabled = false;
    this.addEventListener("disabled", () => (this.disabled = true));
    this.addEventListener("reenabled", () => (this.disabled = false));
  }

  /**
   * Path to the addon's directory.
   *
   * @type {string}
   */
  get dir() {
    return `${this._addonObj._path}addons/${this.id}`;
  }

  /**
   * Path to libraries directory.
   *
   * @type {string}
   */
  get lib() {
    return `${this._addonObj._path}libraries`;
  }

  /** @private */
  get _eventTargetKey() {
    return "self";
  }

  /**
   * Gets a list of addon IDs enabled, optionally filtered using tags.
   *
   * @param {string} [tag] - The tag for filtering.
   *
   * @returns {Promise<string[]>} Enabled addons' IDs.
   */
  getEnabledAddons(tag) {
    return scratchAddons.methods.getEnabledAddons(tag);
  }
}
