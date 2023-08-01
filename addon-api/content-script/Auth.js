import FetchableAuth from "../common/FetchableAuth.js";

/**
 * Authentication related utilities.
 * @extends FetchableAuth
 */
export default class Auth extends FetchableAuth {
  /**
   * @private
   */
  _getCookie(name) {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const cookie = cookies.find((c) => c.startsWith(`${name}=`));
    if (!cookie) return null;
    return cookie.slice(name.length + 1);
  }
}
