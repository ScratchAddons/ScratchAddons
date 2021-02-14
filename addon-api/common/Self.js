import Listenable from "./Listenable.js";

/**
 * @extends Listenable
 */
export default class Self extends Listenable {
  constructor(that, info) {
    super();
    this.id = info.id;
    this.extra = that
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
  }
  get dir() {
    return `${this.extra._path}addons/${this.id}`;
  }

  get lib() {
    return `${this.extra._path}libraries`;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "self";
  }
}
