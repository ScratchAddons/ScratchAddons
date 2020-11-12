import LocalizationProvider from "../../libraries/autoescaper.js";

export default class UserscriptLocalizationProvider extends LocalizationProvider {
  constructor(urls) {
    super();
    this._urls = urls;
    this.generalLoaded = false;
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
          this._refreshDateTime();
          this.generalLoaded = true;
      }
  }
}
