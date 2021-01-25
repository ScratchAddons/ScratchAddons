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
    this.__path = document.getElementById("scratch-addons").getAttribute("data-path");
    this.tab = new Tab(info);
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }
}
