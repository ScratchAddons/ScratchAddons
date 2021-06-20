import Listenable from "./Listenable.js";

/** Handles accounts. */
export default class Account extends Listenable {
  constructor() {
    super();
  }
  /**
   * Fetches message count.
   *
   * @returns {Promise<number>} - Current message count.
   */
  getMsgCount() {
    return scratchAddons.methods.getMsgCount();
  }
  /**
   * Fetches messages.
   *
   * @param {any[]} args
   */
  getMessages(...args) {
    return scratchAddons.methods.getMessages(...args);
  }
  /**
   * Clears unread messages.
   *
   * @returns {Promise<void>}
   */
  clearMessages() {
    return scratchAddons.methods.clearMessages();
  }
}
