import Listenable from "./Listenable.js";

/** Authentication related utilities. */
export default class Auth extends Listenable {
  constructor() {
    super();
    this._addonId = "";
  }
  /**
   * Whether the user is logged in or not.
   *
   * @type {boolean}
   */
  get isLoggedIn() {
    return scratchAddons.globalState.auth.isLoggedIn;
  }
  /**
   * Current username.
   *
   * @type {string | undefined}
   */
  get username() {
    return scratchAddons.globalState.auth.username;
  }
  /**
   * Current user ID.
   *
   * @type {number | undefined}
   */
  get userId() {
    return scratchAddons.globalState.auth.userId;
  }
  /**
   * X-Token used in new APIs.
   *
   * @type {string | undefined}
   */
  get xToken() {
    return scratchAddons.globalState.auth.xToken;
  }
  /**
   * CSRF token used in APIs.
   *
   * @type {string | undefined}
   */
  get csrfToken() {
    return scratchAddons.globalState.auth.csrfToken;
  }
  /**
   * Language of the Scratch website.
   *
   * @type {string}
   */
  get scratchLang() {
    return scratchAddons.globalState.auth.scratchLang;
  }

  /**
   * @type {"auth" & string}
   * @protected
   */
  get _eventTargetKey() {
    return "auth";
  }
}
