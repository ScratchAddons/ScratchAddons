import { escapeHTML } from "./autoescaper.js";
import { MessageFormatter, pluralTypeHandler } from "../../thirdparty/cs/icu-message-formatter.es.min.js";

/**
 * This library is shared between background and userscript. Subclasses are responsible for implementing methods to load
 * translations.
 */
export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._reconfigure();
  }

  /**
   * Reconfigure the provider with the current locale. Must be called after loading translations.
   *
   * @private
   */
  _reconfigure() {
    const locale = this.locale;
    this._date = new Intl.DateTimeFormat(locale);
    this._datetime = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      dateStyle: "short",
    });
    this.formatter = new MessageFormatter(locale, {
      plural: pluralTypeHandler,
    });
  }

  _get(key, placeholders, messageHandler, fallback) {
    messageHandler = messageHandler || ((m) => m);
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      const message = messageHandler(this.messages[key]);
      return this.formatter.format(message, placeholders);
    }
    console.warn("Key missing:", key);
    return fallback || key;
  }

  /**
   * Reconfigure the provider with the current locale. Must be called after loading translations.
   *
   * @private
   */
  get(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, null, fallback);
  }

  /**
   * Get a HTML-escaped translation. Placeholders must be escaped by the caller.
   *
   * @param {string} key - The translation key.
   * @param {object} [placeholders] - Placeholders.
   * @param {string} [fallback] - The fallback string in case the translation is missing.
   * @returns {string} The translation.
   */
  escaped(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, (message) => escapeHTML(message), fallback);
  }

  /**
   * The current locale used. May not match navigator.language or scratchAddons.globalState.auth.scratchLang if the
   * translation is not available for that language.
   *
   * @type {string}
   */
  get locale() {
    return this.messages._locale || "en";
  }

  /**
   * The current locale used. May not match navigator.language or scratchAddons.globalState.auth.scratchLang if the
   * translation is not available for that language.
   *
   * @type {string}
   */
  get localeName() {
    return this.messages._locale_name || "English";
  }

  /**
   * Formats a Date.
   *
   * @param {Date} dateObj - The date.
   * @returns {string}
   */
  date(dateObj) {
    return this._date.format(dateObj);
  }

  /**
   * Formats a Date with time.
   *
   * @param {Date} dateObj - The date.
   * @returns {string}
   */
  datetime(dateObj) {
    return this._datetime.format(dateObj);
  }
}
