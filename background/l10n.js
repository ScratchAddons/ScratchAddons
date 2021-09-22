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
      ...(await Promise.all(
        locales.map(async (locale) => {
          let allMessages = {};
          let skip = false;
          for (const addonId of addonIds) {
            if (skip) continue;
            const url = chrome.runtime.getURL(`addons-l10n/${locale}/${addonId}.json`);
            const messages = await fetch(url)
              .then((resp) => resp.json())
              .catch(() => {
                if (addonId === "_general") skip = true;
              });
            allMessages = Object.assign(messages, allMessages);
          }
          return allMessages;
        })
      )),
    };
    this._reconfigure();
    this.loaded = this.loaded.concat(addonIds);
  }
}
