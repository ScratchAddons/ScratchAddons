export type msg = (key: string, placeholders?: { [key: string]: string }) => string;
type Utils<Addon> = {
  /** APIs for addons. */
  addon: Addon;
  /** Object accessible by all userscripts of the same addon. */
  global: Record<any, any>;
  /** Console API with formatting. */
  console: Console;
  /** Gets localized message from addons-l10n folder. Supports placeholders and plurals. */
  msg: msg & {
    /** Current locale used by msg function. */
    locale: string;
  };
  /** Gets localized and HTML-escaped messages. Placeholders are NOT escaped. */
  safeMsg: msg;
};
export default Utils;
