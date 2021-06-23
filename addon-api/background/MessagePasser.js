/**
 * Handles message passing. Mimics chrome.runtime message passing.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.self.id;

    this._onMessageListeners = [];
    this._onConnectListeners = [];

    let self = this;

    function runListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener(...a));
    }

    chrome.runtime.onMessage.addListener((m, s, sr) => {
      if (!m.addonMessage) return;
      let { payload, addonId } = m,
        { url } = s;

      if (addonId !== self._addonId) return;

      function sendResponse(response) {
        sr({
          payload: response,
          addonId,
        });
      }

      runListeners(
        payload,
        {
          addonId,
          id: addonId,
          url,
        },
        sendResponse
      );
    });
  }

  get onMessage() {
    let self = this;
    function addListener(func) {
      return self._onMessageListeners.push(func);
    }

    function removeListener(func) {
      return self._onMessageListeners.splice(self._onMessageListeners.indexOf(func), 1);
    }

    function hasListener(func) {
      return self._onMessageListeners.includes(func);
    }

    return {
      addListener,
      removeListener,
      hasListener,
    };
  }
}
