import Addon from "../common/Addon.js";
import Popup from "./Popup.js";
import Auth from "./Auth.js";

/**
 * An addon that loads as a popup.
 * @extends Addon
 * @property {Popup} popup
 */
export default class PopupAddon extends Addon {
  constructor(info) {
    super(info);
    this.auth.dispose();
    this.auth = new Auth(this);
    this.popup = new Popup();
  }

  /**
   * @private
   */
  get _path() {
    return chrome.runtime.getURL("");
  }
}
