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
    this.__path = document.getElementById("scratch-addons").getAttribute("data-path");
    this.tab = new Tab(info);
    this.self.disabled = false;
    this.self.late = info.late;

    addEventListener("message", (event) => {
      // let addons = JSON.parse(document.querySelector("#scratch-addons").getAttribute("data-userscripts"));
      // addons.splice(addons.findIndex(i => i.addonId == this._addonId), 1);
      // addons

      if (event.data.saAddonDisabled && this._addonId == event.data.saAddonDisabled) {
        this.self.disabled = true;
        for (let { item, event, listener, useCapture } of this.tab._listeners) {
          item.removeEventListener(event, listener, useCapture);
        }
        this.self.dispatchEvent(new Event("addonDisabled"));
      } else if (event.data.saAddonEnabled && this._addonId == event.data.saAddonEnabled) {
        this.self.disabled = false;
        this.self.dispatchEvent(new Event("addonReeabled"));
      }
    });
  }

  /**
   * @private
   */
  get _path() {
    return this.__path;
  }
}
