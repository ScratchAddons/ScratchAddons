import Listenable from "./Listenable.js";

/**
 * Authentication related utilities.
 * @extends Listenable
 */
export default class Auth extends Listenable {
  constructor(addonObject) {
    super();
  }
  /**
   * Whether the user is logged in or not.
   * @type {boolean}
   */
  get isLoggedIn() {
    return scratchAddons.globalState.auth.isLoggedIn;
  }
  /**
   * Current username.
   * @type {?string}
   */
  get username() {
    return scratchAddons.globalState.auth.username;
  }
  /**
   * Current user ID.
   * @type {?number}
   */
  get userId() {
    return scratchAddons.globalState.auth.userId;
  }
  /**
   * X-Token used in new APIs.
   * @type {?string}
   */
  get xToken() {
    return scratchAddons.globalState.auth.xToken;
  }
  /**
   * CSRF token used in APIs.
   * @type {string}
   */
  get csrfToken() {
    return scratchAddons.globalState.auth.csrfToken;
  }
  /**
   * Language of the Scratch website.
   * @type {string}
   */
  get scratchLang() {
    return scratchAddons.globalState.auth.scratchLang;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "auth";
  }
}
