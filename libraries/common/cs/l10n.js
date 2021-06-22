import { escapeHTML } from "./autoescaper.js";
import { MessageFormatter, findClosingBracket } from "../../thirdparty/cs/icu-message-formatter.es.min.js";

/**
 * This library is shared between background and userscript. Subclasses are responsible for implementing methods to load
 * translations.
 */
export default class LocalizationProvider extends EventTarget {
  constructor() {
    super();
    /** @type {{[key:string]:string}} */
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

  /**
   * Reconfigure the provider with the current locale. Must be called after loading translations.
   */
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

  /**
   * Get a translation.
   *
   * @param {string} key - The translation key.
   * @param {{ [key: string]: string }} [placeholders] - Placeholders.
   * @param {string} [fallback] - The fallback string in case the translation is missing.
   *
   * @returns {string} The translation.
   */
  get(key, placeholders = {}, fallback = "") {
    return this._get(key, placeholders, null, fallback);
  }

  /**
   * Get a HTML-escaped translation. Placeholders must be escaped by the caller.
   *
   * @param {string} key - The translation key.
   * @param {{ [key: string]: string }} [placeholders] - Placeholders.
   * @param {string} [fallback] - The fallback string in case the translation is missing.
   *
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
   * The current locale's name.
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
   *
   * @returns {string}
   */
  date(dateObj) {
    return this._date.format(dateObj);
  }

  /**
   * Formats a Date with time.
   *
   * @param {Date} dateObj - The date.
   *
   * @returns {string}
   */
  datetime(dateObj) {
    return this._datetime.format(dateObj);
  }
}
