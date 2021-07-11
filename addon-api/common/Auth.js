import Listenable from "./Listenable.js";

/**
 * Authentication related utilities.
 * @extends Listenable
 */
export default class Auth extends Listenable {
  constructor(addonObject) {
    super();
    this._refresh();
  }

  /**
   * @private
   */
  _refresh() {
    this._lastUsername = undefined;
    this._lastUserId = undefined;
    this._lastIsLoggedIn = undefined;
    this._lastXToken = undefined;
  }

  /**
   * @private
   */
  _waitUntilFetched() {
    return new Promise((resolve) => this.addEventListener("session", resolve, { once: true }));
  }

  /**
   * @private
   */
  _update(d) {
    this._lastUsername = d.user?.username || null;
    this._lastUserId = d.user?.id || null;
    this._lastIsLoggedIn = !!d.user;
    this._lastXToken = d.user?.token || null;
    this.dispatchEvent(new CustomEvent("session"));
  }

  /**
   * @private
   */
  _fetchProperty(prop) {
    if (typeof this[prop] !== "undefined") return Promise.resolve(this[prop]);
    return this._waitUntilFetched().then(() => this[prop]);
  }

  /**
   * Whether the user is logged in or not.
   * @type {boolean}
   */
  get isLoggedIn() {
    return scratchAddons.globalState.auth.isLoggedIn;
  }
  /**
   * Fetch whether the user is logged in or not.
   * @returns {Promise<boolean>} - whether the user is logged in or not.
   */
  fetchIsLoggedIn() {
    return this._fetchProperty("_lastIsLoggedIn");
  }
  /**
   * Current username.
   * @type {?string}
   */
  get username() {
    return scratchAddons.globalState.auth.username;
  }
  /**
   * Fetch current username.
   * @returns {Promise<?string>} - the username.
   */
  fetchUsername() {
    return this._fetchProperty("_lastUsername");
  }
  /**
   * Current user ID.
   * @type {?number}
   */
  get userId() {
    return scratchAddons.globalState.auth.userId;
  }
  /**
   * Fetch current user ID.
   * @returns {Promise<?number>} - the user ID.
   */
  fetchUserId() {
    return this._fetchProperty("_lastUserId");
  }
  /**
   * X-Token used in new APIs.
   * @type {?string}
   */
  get xToken() {
    return scratchAddons.globalState.auth.xToken;
  }
  /**
   * Fetch X-Token used in new APIs.
   * @returns {Promise<?string>} - the X-Token.
   */
  fetchXToken() {
    return this._fetchProperty("_lastXToken");
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
