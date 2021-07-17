/**
 * Handles message passing. Mimics chrome.runtime message passing.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.id;
  }

  sendMessage(message, callback) {
    let self = this;

    chrome.runtime.sendMessage(
      {
        addonId: self._addonId,
        payload: message,
        addonMessage: true,
      },
      callback
    );
  }

  connect({ name = "" } = {}) {
    return new Port(name, this._addonId);
  }
}

class Port {
  constructor(name, addonId) {
    this.name = name;
    this._onMessageListeners = [];
    this._onDisconnectListeners = [];

    this._port = chrome.runtime.connect({
      name: JSON.stringify({
        addonConnect: true,
        name,
        addonId,
      }),
    });

    let self = this;

    function runMessageListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener?.(...a));
    }

    function runDisconnectListeners(...a) {
      self._onDisconnectListeners.forEach((listener) => listener?.(...a));
    }

    this._port.onMessage.addListener(function (m) {
      runMessageListeners(m);
    });

    this._port.onDisconnect.addListener(function (...a) {
      runDisconnectListeners(...a);
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

  disconnect() {
    this._port.disconnect();
  }

  get onDisconnect() {
    return this._port.onDisconnect;
  }

  postMessage(...a) {
    this._port.postMessage(...a);
  }
}
