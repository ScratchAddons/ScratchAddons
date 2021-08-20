/**
 * Handles message passing for background scripts.
 */

export default class MessagePasser extends EventTarget {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }

  onMessage(onMsgCallback) {
    chrome.runtime.onMessage.addListener(({ addonMsg: { message, addonId } = {} }, sender, callback) => {
      if (addonId === this._addonId) {
        onMsgCallback(message, callback);
      }
      return true;
    });
  }

  broadcast(message) {
    chrome.runtime.sendMessage({ addonMsg: { message, addonId: this._addonId } });
  }
}
