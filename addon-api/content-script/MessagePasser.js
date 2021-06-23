/**
 * Handles message passing. Mimics chrome.runtime message passing.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.id;

    this._onMessageListeners = [];
    this._onConnectListeners = [];

    let self = this;

    function runListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener(...a));
    }

    window.addEventListener(
      "message",
      (e) => {
        if (!e.data.addonMessage) return;

        const {
          data: { addonId, payload, fromBackground, messageId },
        } = e;

        if (addonId !== self._addonId || !fromBackground) return;

        function sendResponse(response) {
          window.postMessage({
            payload: response,
            addonId,
            fromBackground: false,
            addonMessage: true,
            messageId,
            response: true,
          });
        }

        runListeners(
          payload,
          {
            addonId,
            id: addonId,
          },
          sendResponse
        );
      },
      false
    );
  }

  sendMessage(message, callback) {
    let self = this;
    let mid = getuid();

    window.postMessage({
      addonId: self._addonId,
      payload: message,
      fromBackground: false,
      addonMessage: true,
      response: false,
      messageId: mid,
    });

    function onMessage(e) {
      if (!e.data.addonMessage) return;

      const {
        data: { payload, addonId, fromBackground, messageId },
      } = e;

      if (!fromBackground) return;
      if (addonId !== self._addonId) return;
      if (messageId !== mid) return;

      window.removeEventListener("message", onMessage);

      callback(payload);
    }

    window.addEventListener("message", onMessage);

    function getuid() {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_=+{}[]()";
      const length = 20;

      let id = "";
      for (let i = 0; i < length; i++) {
        id += chars[Math.round(Math.random() * chars.length)];
      }

      return id;
    }
  }
}
