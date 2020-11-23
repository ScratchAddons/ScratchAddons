import LocalizationProvider from "../../libraries/l10n.js";

export default class UserscriptLocalizationProvider extends LocalizationProvider {
  constructor(urls) {
    super();
    this._urls = urls;
    this.generalLoaded = false;
  }

  async loadByAddonId(addonId) {
    let valid = true;
    if (addonId !== "_general") {
      if (!this.generalLoaded) {
        await this.loadByAddonId("_general");
      }
      let addonJSON = await fetch(`${document.getElementById("scratch-addons").getAttribute("data-path")}addons/${addonId}/addon.json`)
      addonJSON = await addonJSON.json()
      valid = addonJSON.l10n
    }
    for (const dir of this._urls) {
      let resp;
      let messages = {};
      const url = `${dir}/${addonId}.json`;
      try {
        if (!valid) continue;
        resp = await fetch(url);
        messages = await resp.json();
      } catch (_) {
        continue;
      }
      this._generateCache(messages);
      this.messages = Object.assign(messages, this.messages);
    }
    if (addonId === "_general") {
      this._refreshDateTime();
      this.generalLoaded = true;
    }
  }
}
