import Addon from "../common/Addon.js";
import Notifications from "./Notifications.js";
import Badge from "./Badge.js";

/**
 * An addon that loads as a background script.
 * @extends Addon
 * @property {object} self - the addon's metadata.
 * @property {string} self.id - the addon's ID.
 * @property {string} self.dir - the directory the addon is stored in.
 * @property {string} self.browser - the browser used.
 * @property {function} self.restart - restarts the addon.
 * @property {Notifications} [notifications]
 * @property {Badge} [badge]
 */
export default class BackgroundScriptAddon extends Addon {
  constructor(info) {
    super(info);
    const { id, permissions } = info;
    this._timeouts = [];
    this._intervals = [];
    this.self.restart = () => this._restart();
    if (permissions) {
      if (permissions.includes("notifications")) this.notifications = new Notifications(this);
      if (permissions.includes("badge")) this.badge = new Badge(this);
    }
  }
  _kill() {
    this.auth.dispose();
    this.settings.dispose();
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
