import Storage from "../common/Storage.js";
/**
 * Manages storage.
 * @extends Storage
 */
export default class psStorage extends Storage {
  constructor(addonObject) {
    super(addonObject);
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
    const promisify = (callbackFn) => (...args) => new Promise((resolve) => callbackFn(...args, resolve));
    const storageSet = async (id, value, mode) => {
      return await promisify(chrome.storage[mode].set.bind(chrome.storage[mode]))(Object.fromEntries([[id, value]]));
    };
    const cookieSet = async (name, value) => {
      return await promisify(chrome.cookies.set.bind(chrome.cookies))({
        url: "https://scratch.mit.edu",
        name: name,
        secure: false,
        expirationDate: 2147483647,
        value: value,
      });
    };
    // the stuff that matters: set the value
    var id = request.addonStorageID;
    var mode = request.addonStorageMode;
    var value = request.addonStorageValue;
    var key = id.split("/"); // seperate key into stored ID and addon ID
    var storage = scratchAddons.globalState.addonStorage[mode];
    storage[key[0]] ?? (storage[key[0]] = {}); // just in case the addon has not had any other stored values before
    storage[key[0]][key[1]] = value; // set in scratchAddons.globalStagte.addonStorage
    scratchAddons.globalState.addonStorage[mode] = storage;
    await (mode == "cookie" ? cookieSet(id, value) : storageSet(id, value, mode)); // set it in chrome.storage/document.cookie
    sendResponse({
      name: id,
      value: value,
      mode: mode,
    });
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage";
  }
}
