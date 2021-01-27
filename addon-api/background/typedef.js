/** @typedef {import("./Addon.js").default} BackgroundScriptAddon */
// prettier-ignore
/**
 * Background scripts must default-export an async function
 * that takes this object as a sole argument, e.g.
 * export default async function (util)
 * Note that commonly it is done by using detructing syntax.
 * @typedef {object} BackgroundScriptUtilities
 * @property {BackgroundScriptAddon} addon - APIs for addons
 * @property {function} setInterval - Works like setInterval but with addon unloading support.
 * @property {function} clearInterval - Works like clearInterval but with addon unloading support.
 * @property {function} setTimeout - Works like setTimeout but with addon unloading support.
 * @property {function} clearTimeout - Works like clearTimeout but with addon unloading support.
 * @property {function} msg - Gets localized message from addons-l10n folder. Supports placeholders and plurals.
 * @property {string} msg.locale - Current locale used by msg function.
 * @property {object} global - Object accessible by all userscripts of the same addon.
 * @property {Console} console - Console API with formatting.
 */

export default {};
