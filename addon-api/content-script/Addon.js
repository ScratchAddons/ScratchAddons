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
    this._path = document.getElementById("scratch-addons").getAttribute("data-path");
    this.tab = new Tab(info);
  }

  /**
   * @private
   */
  get path() {
    return this._path;
  }
}
