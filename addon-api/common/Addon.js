import Auth from "./Auth.js";
import Account from "./Account.js";
import fetch from "./fetch.js";
import Settings from "../common/Settings.js";

/**
 * An addon.
 * @property {object} self - the addon's metadata.
 * @property {string} self.id - the addon's ID.
 * @property {string} self.dir - the directory the addon is stored in.
 * @property {string} self.lib - the directory libraries are stored in.
 * @property {string} self.browser - the browser used.
 * @property {Auth} auth
 * @property {Account} account
 * @property {function} fetch - fetches resource from Scratch API with authentication.
 * @property {Settings} settings
 */
export default class Addon {
  constructor(info) {
    this.self = {
      id: info.id,
      browser: typeof InstallTrigger !== "undefined" ? "firefox" : "chrome",
    };
    Object.defineProperties(this.self, {
      dir: {
        enumerable: true,
        get: () => `${this._path}addons/${info.id}`,
      },
      lib: {
        enumerable: true,
        get: () => `${this._path}libraries`,
      },
    });
    this.auth = new Auth(this);
    this.account = new Account();
    this.fetch = fetch;
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
