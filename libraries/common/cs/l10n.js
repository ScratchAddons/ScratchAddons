import { escapeHTML } from "./autoescaper.js";
import { MessageFormatter, pluralTypeHandler } from "../../thirdparty/cs/icu-message-formatter.es.min.js";

// This library is shared between background and userscript.
// Subclasses are responsible for implementing methods to load translations.

export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._reconfigure();
  }

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

  get(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, null, fallback);
  }

  escaped(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, (message) => escapeHTML(message), fallback);
  }

  get locale() {
    return this.messages._locale || "en";
  }

  get localeName() {
    return this.messages._locale_name || "English";
  }

  date(dateObj) {
    return this._date.format(dateObj);
  }

  datetime(dateObj) {
    return this._datetime.format(dateObj);
  }
}
