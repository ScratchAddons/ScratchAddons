import Listenable from "./Listenable.js"
/**
 * Manages storage.
 * @extends Listenable
 */
export default class Storage extends Listenable {
  constructor (addonObject) {
    super()
    this._addonId = addonObject.self.id
    this._extentionId = scratchAddons.eventTargets.self[0].lib.split("/")[2]
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
      throw new Error("Scratch Addons exception: stored ID must be a string")
    }
    if (!["sync", "local", "cookie"].includes(mode)) {
      throw new Error("Scratch Addons exception: mode must be one of: sync, local, or cookie")
    }
    return scratchAddons.globalState.addonStorage[mode][this._addonId]?.[storedID]
    // ?. reuturns null if the previous value is null, otherwise it will continue evaluating as if it wasn't there. if the next charecter is not a [, then it adds a dot.
    //like this: object?.key would be treated as object.key if object was not null. object?.["key"] would be object["key"] if object was not null.)
  }
  /**
   * @private
   */
  get _eventTargetKey() {
    return "storage"
  }
}
