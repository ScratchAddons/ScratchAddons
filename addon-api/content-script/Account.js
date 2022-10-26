import Listenable from "../common/Listenable.js";

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
    return this._addon.auth.fetchIsLoggedIn().then((isLoggedIn) => {
      if (!isLoggedIn) return null;
      return scratchAddons.methods.getMsgCount();
    });
  }
}
