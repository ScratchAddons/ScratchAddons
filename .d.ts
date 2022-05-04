import type { UserscriptAddon } from "./addon-api/types/content-script";
import type { PopupAddon } from "./addon-api/types/popup";

interface Utilities<T> {
  /**
   * APIs for addons
   */
  addon: T;
  /**
   * Gets localized message from addons-l10n folder. Supports placeholders and plurals.
   */
  msg: ((msg: string, placeholders: { [key: string]: string | number }) => string) & {
    /**
     * Current locale used by msg function.
     */
    locale: string;
  };
  /**
   * Gets localized and HTML-escaped messages. Placeholders are NOT escaped.
   */
  safeMsg: (msg: string, placeholders: { [key: string]: string | number }) => string;
  /**
   * Object accessible by all userscripts of the same addon.
   */
  global: { [key: string]: any };
  /**
   * Console API with formatting.
   */
  console: Console;
}

declare global {
  /**
   * Userscripts must default-export an async function
   * that takes this object as a sole argument, e.g.
   * export default async function (util)
   * Note that commonly it is done by using destructing syntax.
   */
  type UserscriptUtilities = Utilities<UserscriptAddon>;

  /**
   * Popups must default-export an async function
   * that takes this object as a sole argument, e.g.
   * export default async function (util)
   * Note that commonly it is done by using destructing syntax.
   */
  type PopupUtilities = Utilities<PopupAddon>;
}
