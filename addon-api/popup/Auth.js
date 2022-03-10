import FetchableAuth from "../common/FetchableAuth.js";

/** Authentication related utilities. */
export default class Auth extends FetchableAuth {
  /** @private */
  _getCookie(name) {
    return scratchAddons.cookies.get(name) || null;
  }
}
