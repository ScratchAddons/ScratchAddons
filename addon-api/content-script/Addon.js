import Addon from "../common/Addon.js";
import Tab from "./Tab.js";
import Auth from "./Auth.js";
import Account from "./Account.js";

/** An addon that loads as a userscript. */
export default class UserscriptAddon extends Addon {
  constructor(info) {
    super(info);
    this._addonId = info.id;
    this.__path = `${new URL(import.meta.url).origin}/`;
    /** @type {Tab} */ this.tab = new Tab(info);
    this.auth.dispose();
    /** @type {Auth} */ this.auth = new Auth(this);/** @type {Auth} */ this.type {Account} */
    this.account = new Account(this);
    this.self.disabled = false;
    this.self.enabledLate = info.enabledLate;
  }

  /** @private */
  get _path() {
    return this.__path;
  }
}
