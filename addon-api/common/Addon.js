import Auth from "./Auth.js";
import Self from "./Self.js";
import Settings from "../common/Settings.js";

/**
 * An addon.
 */
export default class Addon {
  constructor(info) {
    /**
     * Allows addons to get information about themselves or the browser.
     */
    this.self = new Self(this, info);
    this.auth = new Auth(this);
    /**
     * Allows addons to change their behavior according to user-specified addon settings.
     */
    this.settings = new Settings(this);
  }

  /**
   * @abstract
   * @private
   */
  get _path() {
    throw new Error("Subclasses must implement this.");
  }
}
