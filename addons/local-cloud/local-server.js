// Plays the role of Scratch's cloud server for one connection. Values live in
// localStorage, one key per variable, so other tabs of the same origin learn
// about changes through the "storage" event.

import { isValidName, getValueProblem } from "./rules.js";

export const STORAGE_PREFIX = "sa-local-cloud|";

export function storageKey(projectId, name) {
  return `${STORAGE_PREFIX}${projectId}|${name}`;
}

class StorageUnavailable extends Error {}

export class LocalCloudConnection {
  constructor({ storage, send, close, onDropped, onLocalSet }) {
    this._storage = storage;
    this._send = send;
    this._close = close;
    this._onDropped = onDropped;
    this._onLocalSet = onLocalSet;
    this._projectId = null;
    this._open = true;
  }

  get projectId() {
    return this._projectId;
  }

  get isOpen() {
    return this._open;
  }

  // Scratch sends newline-terminated JSON, sometimes several messages at once.
  receive(text) {
    for (const line of String(text).split("\n")) {
      if (!this._open) return;
      if (!line.trim()) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        this._fail(4000, "Invalid JSON");
        return;
      }
      try {
        this._handle(message);
      } catch (error) {
        if (!(error instanceof StorageUnavailable)) throw error;
        this._fail(1006, "Local storage unavailable");
      }
    }
  }

  deliver(name, value) {
    if (!this._open) return;
    this._send(JSON.stringify({ method: "set", name, value }) + "\n");
  }

  // The socket closed itself; nothing to report back.
  dispose() {
    this._open = false;
  }

  _fail(code, reason) {
    this._open = false;
    this._close(code, reason);
  }

  _handle(message) {
    if (!message || typeof message !== "object") return this._fail(4000, "Invalid message");

    if (message.method === "handshake") {
      const projectId = String(message.project_id ?? "").trim();
      if (this._projectId || !projectId || projectId.length > 128 || projectId.includes("|")) {
        return this._fail(4000, "Invalid handshake");
      }
      this._projectId = projectId;
      for (const [name, value] of this._readProject()) this.deliver(name, value);
      return;
    }

    if (!this._projectId) return this._fail(4000, "Handshake required");
    const { name } = message;

    if (message.method === "set" || message.method === "create") {
      if (!isValidName(name)) return this._fail(4000, "Invalid cloud variable name");
      const problem = getValueProblem(message.value);
      if (problem) return this._onDropped(name, message.value, problem);
      this._write(name, message.value);
      this._onLocalSet(this._projectId, name, message.value);
    } else if (message.method === "delete") {
      if (isValidName(name)) this._remove(name);
    } else if (message.method === "rename") {
      const newName = message.new_name;
      if (!isValidName(name) || !isValidName(newName)) return;
      const entry = this._read(name);
      if (!entry) return;
      this._remove(name);
      this._write(newName, entry.v);
    }
    // anything else is ignored, like Scratch's server does
  }

  _storageCall(fn) {
    try {
      return fn();
    } catch {
      throw new StorageUnavailable();
    }
  }

  _write(name, value) {
    // "t" makes every set change the stored string, so the "storage" event
    // fires even when the same value is set twice.
    const data = JSON.stringify({ v: value, t: Date.now() });
    this._storageCall(() => this._storage.setItem(storageKey(this._projectId, name), data));
  }

  _remove(name) {
    this._storageCall(() => this._storage.removeItem(storageKey(this._projectId, name)));
  }

  _read(name) {
    const raw = this._storageCall(() => this._storage.getItem(storageKey(this._projectId, name)));
    return parseEntry(raw);
  }

  _readProject() {
    const prefix = storageKey(this._projectId, "");
    return this._storageCall(() => {
      const values = [];
      for (let i = 0; i < this._storage.length; i++) {
        const key = this._storage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const entry = parseEntry(this._storage.getItem(key));
        if (entry) values.push([key.slice(prefix.length), entry.v]);
      }
      return values;
    });
  }
}

export function parseEntry(raw) {
  if (raw === null || raw === undefined) return null;
  try {
    const entry = JSON.parse(raw);
    return entry && typeof entry === "object" && "v" in entry ? entry : null;
  } catch {
    return null;
  }
}
