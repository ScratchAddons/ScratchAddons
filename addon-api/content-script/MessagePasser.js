/**
 * Handles message passing. Mimics chrome.runtime message passing.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.id;
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
        data: { payload, fromBackground, messageId },
      } = e;

      if (!fromBackground) return;
      if (messageId !== mid) return;

      window.removeEventListener("message", onMessage);

      callback(payload);
    }

    window.addEventListener("message", onMessage);
  }

  connect({ name = "" }) {
    return new Port(name, this._addonId);
  }
}

class Port {
  constructor(name, addonId) {
    this.name = name;
    this._onMessageListeners = [];
    this._onDisconnectListeners = [];
    this._portId = getuid();

    window.postMessage({
      addonConnect: true,
      name,
      portId: this._portId,
      addonId,
    });

    let self = this;

    function runMessageListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener(...a));
    }

    function runDisconnectListeners(...a) {
      self._onDisconnectListeners.forEach((listener) => listener(...a));
    }

    window.addEventListener(
      "message",
      (e) => {
        if (!e.data.addonPortMessage) return;
        if (!e.data.fromBackground) return;
        if (e.data.portId !== self._portId) return;

        if (e.data.disconnect) return runDisconnectListeners();

        runMessageListeners(e.data.payload);
      },
      false
    );
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

  postMessage(m) {
    window.postMessage({
      portId: this._portId,
      payload: m,
      addonPortMessage: true,
    });
  }

  disconnect() {
    window.postMessage({
      portId: this._portId,
      disconnect: true,
      addonPortMessage: true,
    });
  }

  get onDisconnect() {
    let self = this;

    function addListener(func) {
      return self.this._onDisconnectListeners.push(func);
    }

    function removeListener(func) {
      return self._onDisconnectListeners.splice(self._onDisconnectListeners.indexOf(func), 1);
    }

    function hasListener(func) {
      return self._onDisconnectListeners.includes(func);
    }

    return {
      addListener,
      removeListener,
      hasListener,
    };
  }
}

function getuid() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_=+{}[]()";
  const length = 20;

  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars[Math.round(Math.random() * chars.length)];
  }

  return id;
}
