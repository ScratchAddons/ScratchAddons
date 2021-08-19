/**
 * Handles message passing for background scripts.
 */

export default class MessagePasser extends EventTarget {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }

  onMessage(onMsgCallback) {
    chrome.runtime.onMessage.addListener(({ message, addonId }, sender, callback) => {
      if (addonId === this._addonId) {
        onMsgCallback(message, callback);
      }
      return true;
    });
  }
}
