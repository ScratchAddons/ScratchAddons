import Auth from "./Auth.js";
import Self from "./Self.js";
import Settings from "../common/Settings.js";

/** An addon. */
export default class Addon {
  constructor(info) {
    /** @type {Self} */ this.self = new Self(this, info);
    /** @type {Auth} */ this.auth = new Auth(this);
    /** @type {Settings} */ this.settings = new Settings(this);
  }

  /**
   * @private
   * @abstract
   */
  get _path() {
    throw new Error("Subclasses must implement this.");
  }
}
