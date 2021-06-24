import Listenable from "./Listenable.js";

/**
 * Represents information about the addon.
 *
 * @property {string} id The addon's ID.
 * @property {string} browser The browser.
 * @property {boolean} disabled Whether the addon is disabled or not.
 */
export default class Self extends Listenable {
  /**
   * @param {import("./Addon").default} addonObj
   * @param {{ id: any; permissions?: string[] }} info
   */
  constructor(addonObj, info) {
    super();
    /** @protected */
    this._addonId = info.id; // In order to receive fireEvent messages from background
    this.id = info.id;
    /** @protected */
    this._addonObj = addonObj;
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
    this.disabled = false;
    this.enabledLate = undefined;
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

  /**
   * @type {"self" & string}
   * @protected
   */
  get _eventTargetKey() {
    return "self";
  }

  /** Restarts this addon. Only applicable to background scripts. */
  restart() {}
}
