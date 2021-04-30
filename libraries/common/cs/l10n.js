import { escapeHTML } from "./autoescaper.js";
import { MessageFormatter, findClosingBracket } from "../../thirdparty/cs/icu-message-formatter.es.min.js";

// This library is shared between background and userscript.
// Subclasses are responsible for implementing methods to load translations.

export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    this.messages = {};
    this._matchesCache = Object.create(null);
    this.pluralizer = {
      plural: (n, matches) => {
        if (typeof n !== "number") {
          console.warn("Non-number", n, "passed as parameter for", matches, "falling to 0");
          n = 0;
        }
        let pluralType = this.pluralRules.select(n);
        if (Object.prototype.hasOwnProperty.call(this._matchesCache, matches)) {
          const cache = this._matchesCache[matches];
          if (!Object.prototype.hasOwnProperty.call(cache, pluralType)) {
            console.warn(
              "Plural type",
              pluralType,
              "not handled in",
              matches,
              ", falling back to other. \
This can happen when a string is not translated or is incorrectly translated."
            );
            pluralType = "other";
          }
          return cache[pluralType].replace(/#/g, n);
        }
        let i = -1;
        const map = Object.create(null);
        let key = "";
        while (++i < matches.length) {
          switch (matches[i]) {
            case "{": {
              const newIndex = findClosingBracket(matches, ++i);
              map[key] = matches.slice(i, newIndex);
              i = newIndex;
              key = "";
              break;
            }
            case " ":
              break;
            default: {
              key += matches[i];
            }
          }
        }
        this._matchesCache[matches] = map;
        if (!Object.prototype.hasOwnProperty.call(map, pluralType)) {
          console.warn(
            "Plural type",
            pluralType,
            "not handled in",
            matches,
            ", falling back to other. \
This can happen when a string is not translated or is incorrectly translated."
          );
          pluralType = "other";
        }
        return map[pluralType].replace(/#/g, n);
      },
    };
    this._reconfigure();
  }

  _reconfigure() {
    const locale = this.locale;
    this._date = new Intl.DateTimeFormat(locale);
    this._datetime = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      dateStyle: "short",
    });
    this.pluralRules = new Intl.PluralRules(locale);
    this.formatter = new MessageFormatter(locale, this.pluralizer);
    this._matchesCache = Object.create(null);
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
