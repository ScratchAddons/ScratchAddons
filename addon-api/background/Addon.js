import Addon from "../common/Addon.js";
import Notifications from "./Notifications.js";

/**
 * An addon that loads as a background script.
 * @extends Addon
 * @property {Notifications} [notifications]
 */
export default class BackgroundScriptAddon extends Addon {
  constructor(info) {
    super(info);
    const { permissions } = info;
    this._timeouts = [];
    this._intervals = [];
    this.self.restart = () => this._restart();
    if (permissions) {
      if (permissions.includes("notifications")) this.notifications = new Notifications(this);
    }
  }
  _kill() {
    this.auth.dispose();
    this.settings.dispose();
    this.self.dispose();
    if (this.notifications) this.notifications.dispose();
    this._timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this._intervals.forEach((intervalId) => clearInterval(intervalId));
    this._revokeProxy();
  }

  /**
   * @private
   */
  get _path() {
    return chrome.runtime.getURL("");
  }
}
