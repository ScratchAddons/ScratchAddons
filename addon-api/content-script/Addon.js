import Addon from "../common/Addon.js";
import Tab from "./Tab.js";
import Storage from "./Storage.js";

/**
 * An addon that loads as a userscript.
 * @extends Addon
 * @property {Storage} storage
 * @property {Tab} tab
 */
export default class UserscriptAddon extends Addon {
  constructor(info) {
    super(info);
    this._addonId = info.id;
    this.__path = document.getElementById("scratch-addons").getAttribute("data-path");
    this.tab = new Tab(info);
    this.self.disabled = false;
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }
}
