import Addon from "../common/Addon.js";
import Notifications from "./Notifications.js";
import Badge from "./Badge.js";

/**
 * An addon that loads as a background script.
 * @extends Addon
 * @property {Notifications} [notifications]
 * @property {Badge} [badge]
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

  /**
   * @private
   */
  get _path() {
    return chrome.runtime.getURL("");
  }

  /**
   * Issues an intent URL that, when accessed, will perform some side-effects.
   * The intents will become invalid after 30 seconds.
   * Only available on background scripts and popups.
   * @private
   * @param {string} url - the URL to add intents to.
   * @param {...*} intents - the intents to issue.
   * @returns {Promise<string>} the new URL.
   */
  issueIntentURL(url, ...intents) {
    if (intents.length === 0) return Promise.resolve(url);
    const keys = scratchAddons.createIntents(intents);
    const newURL = new URL(url);
    newURL.searchParams.set("sa-intents", keys.join(","));
    return Promise.resolve(String(newURL));
  }
}
