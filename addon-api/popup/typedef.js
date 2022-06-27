/** @typedef {import("./Addon.js").default} PopupAddon */
// prettier-ignore
/**
 * Popups must default-export an async function
 * that takes this object as a sole argument, e.g.
 * export default async function (util)
 * Note that commonly it is done by using destructing syntax.
 * @typedef {object} PopupUtilities
 * @property {PopupAddon} addon - APIs for addons
 * @property {function} msg - Gets localized message from addons-l10n folder. Supports placeholders and plurals.
 * @property {string} msg.locale - Current locale used by msg function.
 * @property {function} safeMsg - Gets localized and HTML-escaped messages. Placeholders are NOT escaped.
 * @property {object} global - Object accessible by all scripts of the same addon. Currently unused.
 * @property {Console} console - Console API with formatting.
 */

export default {};
