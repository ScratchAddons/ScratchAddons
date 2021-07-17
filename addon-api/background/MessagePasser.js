/**
 * Handles message passing. Mimics chrome.runtime message passing.
 */

export default class MessagePasser {
  constructor(addonObject) {
    this._addonId = addonObject.self.id;

    this._onMessageListeners = [];
    this._onConnectListeners = [];

    let self = this;

    function runMessageListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener?.(...a));
    }

    function runConnectListeners(...a) {
      self._onConnectListeners.forEach((listener) => listener?.(...a));
    }

    chrome.runtime.onMessage.addListener((m, s, sr) => {
      if (!m.addonMessage) return;
      let { payload, addonId } = m,
        { url } = s;

      if (addonId !== self._addonId) return;

      runMessageListeners(
        payload,
        {
          addonId,
          id: addonId,
          url,
        },
        sr
      );
    });

    chrome.runtime.onConnect.addListener(function (port) {
      try {
        JSON.parse(port.name);
      } catch {
        return;
      }
      const data = JSON.parse(port.name);
      if (data.addonId !== self._addonId) return;
      if (!data.addonConnect) return;

      runConnectListeners(new Port(port, data.name));
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

  get onConnect() {
    let self = this;
    function addListener(func) {
      return self._onConnectListeners.push(func);
    }

    function removeListener(func) {
      return self._onConnectListeners.splice(self._onConnectListeners.indexOf(func), 1);
    }

    function hasListener(func) {
      return self._onConnectListeners.includes(func);
    }

    return {
      addListener,
      removeListener,
      hasListener,
    };
  }
}

class Port {
  constructor(port, name) {
    this._port = port;
    this.name = name;
    this._onMessageListeners = [];

    let self = this;

    function runListeners(...a) {
      self._onMessageListeners.forEach((listener) => listener(...a));
    }
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
