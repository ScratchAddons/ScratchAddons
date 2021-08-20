import Listenable from "../common/Listenable.js";

/**
 * Handles message passing for content scripts.
 */

export default class MessagePasser extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.id;
    this.onMessageCallback = null;
  }

  sendMessage(message, callback) {
    scratchAddons.methods
      .sendMessage(message, this._addonId)
      .then((response) => {
        if (callback) callback(response);
      })
      .catch(console.error);
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "messaging";
  }
}
