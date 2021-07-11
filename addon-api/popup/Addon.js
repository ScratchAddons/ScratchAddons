import Addon from "../common/Addon.js";
import Popup from "./Popup.js";
import Auth from "../common/Auth.js";

/**
 * An addon that loads as a popup.
 * @extends Addon
 * @property {Popup} popup
 * @property {Auth} auth
 */
export default class PopupAddon extends Addon {
  constructor(info) {
    super(info);
    this.popup = new Popup();
    this.auth = new Auth(this);
  }

  /**
   * @private
   */
  get _path() {
    return chrome.runtime.getURL("");
  }
}
