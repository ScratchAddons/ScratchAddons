import Storage from "../common/Storage.js"
/**
 * Manages storage.
 * @extends Storage
 */
export default class usStorage extends Storage {
  constructor (addonObject) {
    super(addonObject)
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
      throw new Error("Scratch Addons exception: stored ID must be a string")
    }
    if (storedID.length == 0) {
      throw new Error("Scratch Addons exception: stored ID is empty")
    }
    if (storedID.indexOf("/") > -1) {
      throw new Error("Scratch Addons exception: stored ID can not have /s")
    }
    if (!["sync", "local", "cookie"].includes(mode)) {
      throw new Error("Scratch Addons exception: mode must be one of: sync, local, or cookie")
    }
    return await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        this._extentionId,
        {
          addonStorageID: this._addonId + "/" + storedID,
          addonStorageValue: value,
          addonStorageMode: mode,
        }, resolve
      )
    })
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage"
  }
}
