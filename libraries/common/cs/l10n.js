import {escapeHTML} from "./autoescaper.js";
import * as _IntlMessageFormat from "./intl-messageformat.umd.min.js";
const MessageFormat = IntlMessageFormat.IntlMessageFormat;

// This library is shared between background and userscript.
// Subclasses are responsible for implementing methods to load translations.

export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._cache = {};
    this._cache_locale = "";
    this._date = new Intl.DateTimeFormat();
    this._datetime = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        dateStyle: "short"
    });
  }

  _refreshDateTime () {
      this._date = new Intl.DateTimeFormat(this.locale);
      this._datetime = new Intl.DateTimeFormat(this.locale, {
          timeStyle: "short",
          dateStyle: "short"
      });
  }

  _generateCache (messages) {
      messages = messages || this.messages;
      this._cache_locale = messages._locale || this.locale;
      for (const message of Object.keys(messages)) {
          if (message.startsWith("_")) continue;
          this._cache[message] = new MessageFormat(messages[message], this._cache_locale);
      }
  }

  _get (key, placeholders, messageHandler, fallback) {
      // Use cache if raw message is requested, and cache is up-to-date
      if (
          messageHandler === null &&
          this.locale === this._cache_locale &&
          Object.prototype.hasOwnProperty.call(this._cache, key)
      ) {
          return this._cache[key].format(placeholders);
      }
      messageHandler = messageHandler || (m => m);
      if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
        const message = messageHandler(this.messages[key]);
        return (new MessageFormat(message, this.locale)).format(placeholders);
      }
      console.warn('Key missing:', key);
      return fallback || key;
  }

  get(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, null, fallback);
  }

  escaped(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, message => escapeHTML(message), fallback);
  }

  get locale() {
    return this.messages._locale || "en";
  }

  get localeName() {
    return this.messages._locale_name || "English";
  }

  date (dateObj) {
      return this._date.format(dateObj);
  }

  datetime (dateObj) {
      return this._datetime.format(dateObj);
  }
}
