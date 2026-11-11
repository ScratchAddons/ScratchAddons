// A stand-in for the WebSocket Scratch opens to its cloud server. It looks and
// behaves like a WebSocket to scratch-gui, but talks to a local connection
// object instead of the network.

export const CLOUD_HOST = "clouddata.scratch.mit.edu";

export function isCloudUrl(url, base) {
  try {
    return new URL(String(url), base).hostname.toLowerCase() === CLOUD_HOST;
  } catch {
    return false;
  }
}

/**
 * @param {typeof WebSocket} NativeWebSocket the browser's WebSocket, for constants and `instanceof`
 * @param {(socket) => {receive(text: string): void, dispose(): void}} connect
 */
export function createLocalCloudWebSocketClass(NativeWebSocket, connect) {
  const { CONNECTING, OPEN, CLOSING, CLOSED } = NativeWebSocket;

  class LocalCloudWebSocket extends EventTarget {
    constructor(url) {
      super();
      this._url = String(url);
      this._readyState = CONNECTING;
      this._binaryType = "blob";
      this._handlers = { open: null, message: null, error: null, close: null };
      this._connection = connect(this);
      // A real socket never opens synchronously; Scratch attaches its handlers first.
      queueMicrotask(() => this._opened());
    }

    get url() {
      return this._url;
    }
    get readyState() {
      return this._readyState;
    }
    get bufferedAmount() {
      return 0;
    }
    get extensions() {
      return "";
    }
    get protocol() {
      return "";
    }
    get binaryType() {
      return this._binaryType;
    }
    set binaryType(value) {
      if (value === "blob" || value === "arraybuffer") this._binaryType = value;
    }

    send(data) {
      if (this._readyState === CONNECTING) {
        throw new DOMException("WebSocket is still in CONNECTING state.", "InvalidStateError");
      }
      if (this._readyState !== OPEN) return; // native sockets silently drop data after close
      this._connection.receive(String(data));
    }

    close(code, reason) {
      if (code !== undefined && code !== 1000 && (code < 3000 || code > 4999)) {
        throw new DOMException("The close code must be 1000 or between 3000 and 4999.", "InvalidAccessError");
      }
      if (this._readyState === CLOSING || this._readyState === CLOSED) return;
      this._readyState = CLOSING;
      this._connection.dispose();
      // No network round-trip, so the close completes right away.
      queueMicrotask(() => this._closed(code || 1000, reason || "", true));
    }

    _emit(event) {
      const handler = this._handlers[event.type];
      if (handler) {
        try {
          handler.call(this, event);
        } catch (error) {
          queueMicrotask(() => {
            throw error;
          });
        }
      }
      this.dispatchEvent(event);
    }

    _opened() {
      if (this._readyState !== CONNECTING) return;
      this._readyState = OPEN;
      this._emit(new Event("open"));
    }

    _deliver(text) {
      if (this._readyState !== OPEN) return;
      this._emit(new MessageEvent("message", { data: text, origin: `wss://${CLOUD_HOST}` }));
    }

    _closed(code, reason, wasClean) {
      if (this._readyState === CLOSED) return;
      const wasConnecting = this._readyState === CONNECTING;
      this._readyState = CLOSED;
      if (wasConnecting && !wasClean) this._emit(new Event("error"));
      this._emit(new CloseEvent("close", { code: code || 1006, reason: reason || "", wasClean: Boolean(wasClean) }));
    }
  }

  for (const type of ["open", "message", "error", "close"]) {
    Object.defineProperty(LocalCloudWebSocket.prototype, `on${type}`, {
      configurable: true,
      enumerable: true,
      get() {
        return this._handlers[type];
      },
      set(callback) {
        this._handlers[type] = typeof callback === "function" ? callback : null;
      },
    });
  }
  // So that `socket instanceof WebSocket` still holds.
  Object.setPrototypeOf(LocalCloudWebSocket.prototype, NativeWebSocket.prototype);

  return LocalCloudWebSocket;
}
