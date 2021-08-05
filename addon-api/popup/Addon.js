import Addon from "../common/Addon.js";
import Popup from "./Popup.js";

/**
 * An addon that loads as a popup.
 * @extends Addon
 * @property {Popup} popup
 */
export default class PopupAddon extends Addon {
  constructor(info) {
    super(info);
    this.popup = new Popup();
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
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          createIntents: intents,
        },
        (keys) => {
          const newURL = new URL(url);
          newURL.searchParams.set("sa-intents", keys.join(","));
          resolve(String(newURL));
        }
      );
    });
  }
}
