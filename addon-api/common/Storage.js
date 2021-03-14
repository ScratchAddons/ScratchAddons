import Storage from "../common/Storage.js";
/**
 * Manages storage.
 * @extends Storage
 */
export default class usStorage extends Storage {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
    this._extentionId = scratchAddons.eventTargets.self[0].lib.split("/")[2];
  }
  /**
   * Gets a stored string.
   * @param {string} storedID - ID of the string.
   * @param {string} mode - how it was stored: sync, local, or cookie
   * @throws mode is invalid.
   * @throws stored ID is of invalid type.
   * @returns {*} stored string.
   */
  get(storedID, mode) {
    if (typeof storedID !== "string") {
      throw new Error("Scratch Addons exception: stored ID must be a string");
    }
    if (!["sync", "local", "cookie"].includes(mode)) {
      throw new Error("Scratch Addons exception: mode must be one of: sync, local, or cookie");
    }
    return scratchAddons.globalState.addonStorage[mode][this._addonId]?.[storedID];
    // ?. returns null if the previous value is null, otherwise it will continue evaluating as if it wasn't there. if the next charecter is not a [, then it adds a dot.
    //like this: object?.key would be treated as object.key if object was not null. object?.["key"] would be object["key"] if object was not null.)
  }
  /**
   * Stores a string.
   * @param {string} storedID - ID of the string.
   * @param {*} value - value to store.
   * @param {string} mode - how to store: sync, local, or cookie
   * @throws mode is invalid.
   * @throws stored ID is of invalid type.
   * @throws stored ID has invalid charecters.
   * @throws stored ID is empty.
   * @returns {null}.
   */
  async set(storedID, value, mode) {
    if (typeof storedID !== "string") {
      throw new Error("Scratch Addons exception: stored ID must be a string");
    }
    if (storedID.length == 0) {
      throw new Error("Scratch Addons exception: stored ID is empty");
    }
    if (storedID.indexOf("/") > -1) {
      throw new Error("Scratch Addons exception: stored ID can not have /s");
    }
    if (!["sync", "local", "cookie"].includes(mode)) {
      throw new Error("Scratch Addons exception: mode must be one of: sync, local, or cookie");
    }
    if (chrome.storage) {
      import { setStorage } from "../../background/get-addon-storage.js";
      return await setStorage({
        addonStorageID: this._addonId + "/" + storedID,
        addonStorageValue: value,
        addonStorageMode: mode,
      });
    } else {
      return await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          this._extentionId,
          {
            addonStorageID: this._addonId + "/" + storedID,
            addonStorageValue: value,
            addonStorageMode: mode,
          },
          resolve
        );
      });
    }
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage";
  }
}
