import {escapeHTML} from "./autoescaper.js";

// This library is shared between background and userscript.
// Subclasses are responsible for implementing methods to load translations.

export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._date = new Intl.DateTimeFormat();
    this._datetime = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        dateStyle: "short"
    });
  }

  static _replacePlaceholders(msg, placeholders) {
    return msg.replace(/\$([\w-]+)\$/g, (_, placeholder) => {
      if (Object.prototype.hasOwnProperty.call(placeholders, placeholder)) {
        return placeholders[placeholder];
      }
      return "";
    });
  }
  
  _replacePlaceholders (...args) {
      return LocalizationProvider._replacePlaceholders(...args);
  }
  
  _refreshDateTime () {
      this._date = new Intl.DateTimeFormat(this.locale);
      this._datetime = new Intl.DateTimeFormat(this.locale, {
          timeStyle: "short",
          dateStyle: "short"
      });
  }

  get(key, placeholders = {}) {
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      return this._replacePlaceholders(this.messages[key], placeholders);
    }
    console.warn('Key missing:', key);
    return key;
  }
  
  escaped(key, placeholders = {}) {
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      return this._replacePlaceholders(escapeHTML(this.messages[key]), placeholders);
    }
    console.warn('Key missing:', key);
    return key;
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
