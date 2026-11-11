import { createLocalCloudWebSocketClass, isCloudUrl } from "./fake-socket.js";
import { LocalCloudConnection, STORAGE_PREFIX, parseEntry, storageKey } from "./local-server.js";
import { MAX_VALUE_LENGTH } from "./rules.js";

export default async function ({ addon, console, msg }) {
  const NativeWebSocket = window.WebSocket;

  // Accessing window.localStorage itself can throw (blocked site data), so
  // every call goes through here; LocalCloudConnection handles the errors.
  const storage = {
    get length() {
      return localStorage.length;
    },
    key: (i) => localStorage.key(i),
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };

  /** Local connections that are open in this tab: { conn, socket } */
  const open = new Set();

  const describeValue = (value) => (JSON.stringify(value) ?? String(value)).slice(0, 60);

  const connect = (socket) => {
    const entry = { socket, conn: null };
    entry.conn = new LocalCloudConnection({
      storage,
      send: (text) => socket._deliver(text),
      close: (code, reason) => {
        open.delete(entry);
        if (code === 1006) console.warn(msg("storage-error"));
        socket._closed(code, reason, false);
      },
      onDropped: (name, value, problem) => {
        if (!addon.settings.get("log-dropped")) return;
        const reason = msg(`reason-${problem}`, { max: MAX_VALUE_LENGTH });
        console.warn(msg("dropped", { name, value: describeValue(value), reason }));
      },
      // Other tabs learn about the change through the "storage" event, but
      // that event never fires in the tab that made the change.
      onLocalSet: (projectId, name, value) => {
        for (const other of open) {
          if (other !== entry && other.conn.projectId === projectId) other.conn.deliver(name, value);
        }
      },
    });
    open.add(entry);
    return {
      receive: (text) => entry.conn.receive(text),
      dispose: () => {
        entry.conn.dispose();
        open.delete(entry);
      },
    };
  };

  const LocalCloudWebSocket = createLocalCloudWebSocketClass(NativeWebSocket, connect);

  // Stays installed while the addon is disabled; the check happens per call.
  window.WebSocket = new Proxy(NativeWebSocket, {
    construct(target, args, newTarget) {
      if (!addon.self.disabled && isCloudUrl(args[0], location.href)) return new LocalCloudWebSocket(args[0]);
      return Reflect.construct(target, args, newTarget);
    },
  });

  window.addEventListener("storage", (event) => {
    if (addon.self.disabled || !event.key?.startsWith(STORAGE_PREFIX) || event.newValue === null) return;
    const rest = event.key.slice(STORAGE_PREFIX.length);
    const separator = rest.indexOf("|");
    const projectId = rest.slice(0, separator);
    const name = rest.slice(separator + 1);
    const entry = parseEntry(event.newValue);
    if (!entry) return;
    for (const { conn } of open) {
      if (conn.projectId === projectId) conn.deliver(name, entry.v);
    }
  });

  // If Scratch already opened a real cloud connection (addon enabled late, or
  // this script ran after the project loaded), close it. Scratch reconnects on
  // its own, and the new connection goes through the patched constructor.
  const kickNativeCloudConnection = () => {
    let connection;
    try {
      connection = addon.tab.traps.vm.runtime.ioDevices.cloud.provider?.connection;
    } catch {
      return; // VM not available yet: no cloud connection can exist yet either
    }
    if (connection instanceof LocalCloudWebSocket || !(connection instanceof NativeWebSocket)) return;
    if (connection.readyState === NativeWebSocket.CONNECTING || connection.readyState === NativeWebSocket.OPEN) {
      connection.close();
    }
  };

  // Disabling: close local connections so Scratch reconnects to the real cloud.
  addon.self.addEventListener("disabled", () => {
    for (const entry of [...open]) {
      open.delete(entry);
      entry.conn.dispose();
      entry.socket._closed(1006, "", false);
    }
  });
  addon.self.addEventListener("reenabled", kickNativeCloudConnection);

  kickNativeCloudConnection();

  // Badge next to the stop button: shows that the local cloud is active and
  // resets this project's local values on click.
  const currentProjectId = () => {
    const connected = [...open].reverse().find((entry) => entry.conn.projectId);
    return connected?.conn.projectId ?? location.pathname.match(/\/projects\/(\d+)/)?.[1] ?? null;
  };
  const resetProject = (projectId) => {
    const prefix = storageKey(projectId, "");
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) keys.push(key);
      }
      for (const key of keys) localStorage.removeItem(key);
    } catch {
      console.warn(msg("storage-error"));
    }
  };
  const badge = document.createElement("button");
  badge.className = "sa-local-cloud-badge";
  badge.textContent = msg("badge");
  badge.title = msg("badge-tooltip");
  badge.addEventListener("click", () => {
    const projectId = currentProjectId();
    if (projectId && confirm(msg("confirm-reset"))) resetProject(projectId);
  });
  addon.tab.displayNoneWhileDisabled(badge);

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: badge, order: 10 });
  }
}
