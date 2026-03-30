import LocalizationProvider from "../../libraries/common/cs/l10n.js";

export default class UserscriptLocalizationProvider extends LocalizationProvider {
  constructor(urls) {
    super();
    this._urls = new Set(urls);
    this.generalLoaded = false;
  }

  async loadByAddonId(addonId) {
    if (addonId !== "_general" && !this.generalLoaded) {
      await this.loadByAddonId("_general");
    }
    let addonMessages = {};
    for (const dir of this._urls) {
      const url = `${dir}/${addonId}.json`;
      try {
        const resp = await fetch(url);
        const messages = await resp.json();
        addonMessages = Object.assign(messages, addonMessages);
        this.messages = Object.assign(messages, this.messages);
      } catch (_) {
        if (addonId === "_general") {
          this._urls.delete(dir);
        }
      }
    }
    if (addonId === "_general") {
      this._reconfigure();
      this.generalLoaded = true;
    }
  }
}
