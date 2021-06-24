/** @file Auto-escape Input to prevent XSS. */

/**
 * Escapes HTML special characters.
 *
 * @param {string} str - The string.
 *
 * @returns {string} HTML-escaped string.
 */
const escapeHTML = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);
/**
 * Auto-escapes inputs of template strings.
 *
 * @example
 *   autoescaper`trusted code ${untrusted_value}`;
 *
 * @param {string[]} strings - The template string.
 * @param {...string} dangerous - The inputs.
 *
 * @returns {string} String with inputs escaped.
 */
const autoescaper = (strings, ...dangerous) => {
  let r = "";
  let i = 0;
  for (; i < strings.length; i++) {
    r += strings[i];
    if (i !== dangerous.length) r += escapeHTML(String(dangerous[i]));
  }
  return r;
};

export default autoescaper;

export { escapeHTML };
