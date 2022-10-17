import Listenable from "./Listenable";

/**
 * Manages addon sync and local storage.
 * @extends Listenable
 * @property {SyncStorage} sync synced storage.
 * @property {LocalStorage} local local storage.
 */
export default class Storage extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
    this.sync = new SyncStorage(addonObject);
    this.local = new LocalStorage(addonObject);
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage";
  }
}

class SyncStorage extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }

  /**
   * Set a value in the synced storage.
   * @param {string} prop property/value name.
   * @param {any} value the value to set it to.
   * @returns {Promise<void>} promise that resolves after the value has been changed.
   */
  set(prop, value) {
    return scratchAddons.methods.updateAddonStorage(this._addonId, prop, value, true);
  }
  /**
   * Get a value from the synced storage.
   * @param {string} prop the property/value name.
   * @returns {Promise<any>} the retrieved value.
   */
  get(prop) {
    return scratchAddons.methods.getFromAddonStorage(this._addonId, prop, true);
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage_sync";
  }
}

class LocalStorage extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }

  /**
   * Set a value in the local storage.
   * @param {string} prop property/value name.
   * @param {any} value the value to set it to.
   * @returns {Promise<void>} promise that resolves after the value has been changed.
   */
  set(prop, value) {
    return scratchAddons.methods.updateAddonStorage(this._addonId, prop, value, false);
  }
  /**
   * Get a value from the local storage.
   * @param {string} prop the property/value name.
   * @returns {Promise<any>} the retrieved value.
   */
  get(prop) {
    return scratchAddons.methods.getFromAddonStorage(this._addonId, prop, false);
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage_local";
  }
}
