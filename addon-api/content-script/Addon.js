import Addon from "../common/Addon.js";
import Tab from "./Tab.js";

/**
 * An addon that loads as a userscript.
 * @extends Addon
 * @property {Tab} tab
 */
export default class UserscriptAddon extends Addon {
  constructor(info) {
    super(info);
    this._addonId = info.id;
    this.__path = `${new URL(import.meta.url).origin}/`;
    this.tab = new Tab(info);
    this.self.disabled = false;
    this.self.enabledLate = info.enabledLate;
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }
}
