import {escapeHTML} from "../../libraries/autoescaper.js";

export default class Localization extends EventTarget {
  constructor(urls) {
    super();
    this._urls = urls;
    this.generalLoaded = false;
    this.messages = {};
    this._date = new Intl.DateTimeFormat();
    this._datetime = new Intl.DateTimeFormat([], {
        timeStyle: "short",
        dateStyle: "short"
    });
  }

  _replacePlaceholders(msg, placeholders) {
    return msg.replace(/\$([\w-]+)\$/g, (_, placeholder) => {
      if (Object.prototype.hasOwnProperty.call(placeholders, placeholder)) {
        return placeholders[placeholder];
      }
      return "";
    });
  }
  
  async loadByAddonId (addonId) {
      if (addonId !== "_general" && !this.generalLoaded) {
          await this.loadByAddonId("_general");
      }
      for (const dir of this._urls) {
          let resp;
          let messages = {};
          const url = `${dir}/${addonId}.json`;
          try {
            resp = await fetch(url);
            messages = await resp.json();
          } catch (_) {
            continue;
          }
          this.messages = Object.assign(messages, this.messages);
      }
      if (addonId === "_general") {
          this._date = new Intl.DateTimeFormat(this.locale);
          this._datetime = new Intl.DateTimeFormat(this.locale, {
              timeStyle: "short",
              dateStyle: "short"
          });
          this.generalLoaded = true;
      }
  }

  get(key, placeholders = {}) {
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      return this._replacePlaceholders(this.messages[key], placeholders);
    }
    return key;
  }
  
  escaped(key, placeholders = {}) {
    if (Object.prototype.hasOwnProperty.call(this.messages, key)) {
      return this._replacePlaceholders(escapeHTML(this.messages[key]), placeholders);
    }
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
