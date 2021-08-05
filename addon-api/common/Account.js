import Listenable from "./Listenable.js";

/**
 * Handles accounts.
 * @extends Listenable
 */
export default class Account extends Listenable {
  constructor(addon) {
    super();
    this._addon = addon;
  }
  /**
   * Fetches message count.
   * @returns {Promise<?number>} - current message count.
   */
  getMsgCount() {
    return scratchAddons.methods.getMsgCount();
  }
  /**
   * Fetches messages.
   * @returns {Promise<object[]>} - current messages.
   */
  getMessages(...args) {
    return scratchAddons.methods.getMessages(...args);
  }
  /**
   * Returns an URL that can be opened to clear unread messages.
   * @param {string=} url - the base URL.
   * @returns {Promise<string>} the new URL.
   */
  getClearMessagesIntent(url = "https://scratch.mit.edu/scratch-addons-extension/clear-messages/") {
    return this._addon.issueIntentURL(url, "clearMessages");
  }
}
