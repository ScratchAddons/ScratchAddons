import Auth from "../common/Auth.js";
import Account from "../common/Account.js";
import fetch from "../common/fetch.js";
import Notifications from "./Notifications.js";
import Badge from "./Badge.js";
import Settings from "../common/Settings.js";

export default class Addon {
  constructor(info) {
    const { id, permissions } = info;
    this._timeouts = [];
    this._intervals = [];
    const that = this;
    this.self = {
      id,
      dir: `${chrome.runtime.getURL("")}addons/${id}`,
      browser: typeof InstallTrigger !== "undefined" ? "firefox" : "chrome",
      restart() {
        return that._restart();
      },
    };
    this.auth = new Auth(this);
    this.account = new Account();
    this.fetch = fetch;
    this.settings = new Settings(this);
    if (permissions) {
      if (permissions.includes("notifications")) this.notifications = new Notifications(this);
      if (permissions.includes("badge")) this.badge = new Badge(this);
    }
  }
  _kill() {
    this.auth._removeEventListeners();
    this.settings._removeEventListeners();
    if (this.notifications) this.notifications._removeEventListeners();
    this._timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this._intervals.forEach((intervalId) => clearInterval(intervalId));
    this._revokeProxy();
  }
}
