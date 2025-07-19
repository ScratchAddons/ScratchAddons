/** @typedef {import("./Addon.js").default} UserscriptAddon */

/**
 * @callback MessageFunction
 * @param {string} message The name of the message.
 * @param {Object.<string, number | string> =} [placeholders] The values to be inserted for the placeholders.
 * @returns {string}
 */

/**
 * Userscripts must default-export an async function
 * that takes this object as a sole argument, e.g.
 * export default async function (util)
 * Note that commonly it is done by using destructing syntax.
 * @typedef {object} AddonAPI
 * @property {UserscriptAddon} addon APIs for addons.
 * @property {MessageFunction} msg Gets localized message from addons-l10n folder. Supports placeholders and plurals.
 * @property {string} msg.locale Current locale used by msg function.
 * @property {MessageFunction} safeMsg Gets localized and HTML-escaped messages. Placeholders are NOT escaped.
 * @property {Console} console Console API with formatting.
 */

export default {};
