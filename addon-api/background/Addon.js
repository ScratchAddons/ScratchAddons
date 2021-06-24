import Addon from "../common/Addon.js";
import Notifications from "./Notifications.js";
import Badge from "./Badge.js";

/**
 * An addon that loads as a background script.
 *
 * @property {Notifications} [notifications]
 * @property {Badge} [badge]
 */
export default class BackgroundScriptAddon extends Addon {
  /** @param {{ id: any; permissions?: string[] }} info */
  constructor(info) {
    super(info);
    const { permissions } = info;
    /**
     * @type {NodeJS.Timeout[]}
     */
    this._timeouts = [];
    /**
     * @type {NodeJS.Timeout[]}
     */
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
    this.self.dispose();
    if (this.notifications) this.notifications.dispose();
    this._timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this._intervals.forEach((intervalId) => clearInterval(intervalId));
    this._revokeProxy();
  }

  _restart() {}

  _revokeProxy() {}

  get _path() {
    return chrome.runtime.getURL("");
  }
}
