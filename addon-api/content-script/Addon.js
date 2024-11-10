import Addon from "../common/Addon.js";
import Tab from "./Tab.js";
import Auth from "./Auth.js";

/**
 * An addon that loads as a userscript.
 */
export default class UserscriptAddon extends Addon {
  constructor(info) {
    super(info);
    /** @private */
    this._addonId = info.id;
    /** @private */
    this.__path = `${new URL(import.meta.url).origin}/`;
    /**
     * Allows addon userscripts to get information about the tab they’re currently running on.
     */
    this.tab = new Tab(this, info);
    this.auth.dispose();
    /**
     * Allows addons to get information about the current Scratch account session.
     */
    this.auth = new Auth(this);
    this.self.disabled = false;
    this.self.enabledLate = info.enabledLate;
  }

  /** @private */
  get _path() {
    return this.__path;
  }
}
