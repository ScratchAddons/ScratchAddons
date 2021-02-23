import Listenable from "./Listenable.js";

/**
 * @extends Listenable
 */
export default class Self extends Listenable {
  constructor(addonObj, info) {
    super();
    this.id = info.id;
    this._addonObj = addonObj;
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
  }
  get dir() {
    return `${this._addonObj._path}addons/${this.id}`;
  }

  get lib() {
    return `${this._addonObj._path}libraries`;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "self";
  }
}
