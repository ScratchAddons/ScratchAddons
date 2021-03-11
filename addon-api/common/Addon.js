import Auth from "./Auth.js";
import Account from "./Account.js";
import Self from "./Self.js";
import Settings from "../common/Settings.js";
import Storage from "../common/Storage.js";

/**
 * An addon.
 * @property {object} self - the addon's metadata.
 * @property {string} self.id - the addon's ID.
 * @property {string} self.dir - the directory the addon is stored in.
 * @property {string} self.lib - the directory libraries are stored in.
 * @property {string} self.browser - the browser used.
 * @property {Auth} auth
 * @property {Account} account
 * @property {Settings} settings
 * @property {Storage} storage
 */
export default class Addon {
  constructor(info) {
    this.self = new Self(this, info);
    this.auth = new Auth(this);
    this.account = new Account();
    this.settings = new Settings(this);
    this.storage = new Storage(this);
  }

  /**
   * @abstract
   * @private
   */
  get _path() {
    throw new Error("Subclasses must implement this.");
  }
}
