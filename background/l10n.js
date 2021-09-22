import LocalizationProvider from "../libraries/common/cs/l10n.js";

export default class BackgroundLocalizationProvider extends LocalizationProvider {
  constructor() {
    super();
    this.loaded = [];
  }

  async load(addonIds) {
    addonIds = ["_general", ...addonIds].filter(
      (addonId) => !addonId.startsWith("//") && !this.loaded.includes(addonId)
    );
    const ui = chrome.i18n.getUILanguage().toLowerCase();
    const locales = [ui];
    if (ui.includes("-")) locales.push(ui.split("-")[0]);
    if (ui.startsWith("pt") && ui !== "pt-br") locales.push("pt-br");
    if (!locales.includes("en")) locales.push("en");

    this.messages = {
      ...Promise.all(
        locales.map(async (locale) => {
          let allMessages = {};
          for (const addonId of addonIds) {
            let resp;
            let messages = {};
            const url = chrome.runtime.getURL(`addons-l10n/${locale}/${addonId}.json`);
            try {
              resp = await fetch(url);
              messages = await resp.json();
            } catch (_) {
              if (addonId === "_general") return;
              continue;
            }
            allMessages = Object.assign(messages, allMessages);
          }
          return allMessages;
        })
      ),
    };
    this._reconfigure();
    this.loaded = this.loaded.concat(addonIds);
  }
}
