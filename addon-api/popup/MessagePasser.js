import Listenable from "../common/Listenable.js";

/**
 * Handles message passing.
 */

export default class MessagePasser extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.id;
  }

  sendMessage(message, callback) {
    chrome.runtime.sendMessage({ addonMsg: { message, addonId: this._addonId } }, callback);
  }

  onMessage(callback) {
    chrome.runtime.onMessage.addListener(({ addonMsg: { message, addonId } = {} }) => {
      if (addonId === this._addonId) {
        callback(message);
      }
    });
  }
}
