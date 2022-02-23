import Listenable from "../common/Listenable.js";

/** Handles accounts. */
export default class Account extends Listenable {
  constructor(addon) {
    super();
    this._addon = addon;
  }

  /**
   * Fetches message count.
   *
   * @returns {Promise<null | number>} - Current message count.
   */
  getMsgCount() {
    return this._addon.auth.fetchIsLoggedIn().then((isLoggedIn) => {
      if (!isLoggedIn) return null;
      return scratchAddons.methods.getMsgCount();
    });
  }
}
