import Listenable from "./Listenable.js";

/**
 * Manages storage.
 * @extends Listenable
 */
export default class Storage extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
  }
  /**
   * Gets a stored string.
   * @param {string} storedID - ID of the string.
   * @returns {*} stored string.
   */
  get(storedID) {
    return scratchAddons.globalState.addonStorage[this._addonId] ?. [storedID];
    // ?. reuturns null if the previous value is null, otherwise it will continue evaluating as if it wasn't there. if the next charecter is not a [, then it adds a dot.
    //like this: object?.key would be treated as object.key if object was not null. object?.["key"] would be object["key"] if object was not null.)
  }
  /**
   * Stores a string.
   * @param {string} storedID - ID of the string.
   * @param {*} value - value to store.
   * @returns {null}.
   */
  set(storedID, value) {
    chrome.runtime.sendMessage("npijjahcnpemcijdgoioaclneonckman", {
      addonStorageID: this._addonId + "/" + storedID,
      addonStorageValue: value
    });
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage";
  }
}
