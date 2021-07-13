import Auth from "./Auth.js";
import Account from "./Account.js";
import Self from "./Self.js";
import Settings from "../common/Settings.js";

/**
 * An addon.
 * @property {Self} self
 * @property {Account} account
 * @property {Settings} settings
 * @property {Auth} auth
 */
export default class Addon {
  constructor(info) {
    this.self = new Self(this, info);
    this.account = new Account();
    this.settings = new Settings(this);
    this.auth = new Auth(this);
  }

  /**
   * @abstract
   * @private
   */
  get _path() {
    throw new Error("Subclasses must implement this.");
  }
}
