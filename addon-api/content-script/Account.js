import AccountCommon from "../common/Account.js";

export default class Account extends AccountCommon {
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

  /**
   * @returns {Promise} - a promise that always rejects.
   */
  getMessages() {
    return Promise.reject(new Error("This method is unavailable."));
  }

  /**
   * @returns {Promise} - a promise that always rejects.
   */
  getClearMessagesIntent() {
    return Promise.reject(new Error("This method is unavailable."));
  }
}
