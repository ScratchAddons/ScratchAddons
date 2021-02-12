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
    this.listeners = [];
    this.disabled = false;

    addEventListener("message", (event) => {
      if (this._addonId == event.data.saAddonDisabled) {
        this.disabled = true;
        for (let { item, event, listener, useCapture } of this.listeners) {
          item.removeEventListener(event, listener, useCapture);
        }
        this.dispatchEvent(new Event("addonDisabled"));
      }
    });
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }

  bindListener(item, event, listener, useCapture) {
    item.addEventListener(event, listener, useCapture);
    this.listeners.push({ item, event, listener, useCapture });
  }
}
