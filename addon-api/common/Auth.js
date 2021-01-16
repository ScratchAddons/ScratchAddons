/**
 * Authentication related utilities.
 * @extends EventTarget
 */
export default class Auth extends EventTarget {
  constructor(addonObject) {
    super();
    scratchAddons.eventTargets.auth.push(this);
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
  _removeEventListeners() {
    scratchAddons.eventTargets.auth.splice(
      scratchAddons.eventTargets.auth.findIndex((x) => x === this),
      1
    );
  }
}
