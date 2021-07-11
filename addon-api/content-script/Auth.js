import AuthCommon from "../common/Auth.js";

export default class Auth extends AuthCommon {
  /**
   * @private
   */
  _getCookie(name) {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const cookie = cookies.find((c) => c.startsWith(`${name}=`));
    if (!cookie) return null;
    return cookie.slice(name.length + 1);
  }

  /**
   * CSRF token used in APIs.
   * @type {string}
   */
  get csrfToken() {
    return this._getCookie("scratchcsrftoken");
  }

  /**
   * Language of the Scratch website.
   * @type {string}
   */
  get scratchLang() {
    return this._getCookie("scratchlanguage");
  }
}
