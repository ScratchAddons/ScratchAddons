import Listenable from "../common/Listenable.js";

/**
 * Handles message passing for background scripts.
 */

export default class MessagePasser extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }

  onMessage(callback) {
    chrome.runtime.onMessage.addListener(({ addonMsg: { message, addonId } = {} }, sender, sendResponse) => {
      if (addonId === this._addonId) {
        callback(message, sendResponse);
      }
      return true;
    });
  }

  broadcast(message) {
    chrome.runtime.sendMessage({ addonMsg: { message, addonId: this._addonId } });
    chrome.tabs.query({}, (tabs) =>
      tabs.forEach((tab) => {
        if (tab.url || (!tab.url && typeof browser !== "undefined")) {
          chrome.tabs.sendMessage(tab.id, { addonMsg: { message, addonId: this._addonId } });
        }
      })
    );
  }
}
