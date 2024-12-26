import LocalizationProvider from "../libraries/common/cs/l10n.js";

export default class BackgroundLocalizationProvider extends LocalizationProvider {
  constructor() {
    super();
    this.loaded = [];
  }

  loadFromCache({ messages, loaded }) {
    // This will REMOVE any messages that were already loaded.
    this.messages = messages;
    this._reconfigure();
    this.loaded = loaded;
  }

  async load(addonIds) {
    addonIds = ["_general", ...addonIds].filter(
      (addonId) => !addonId.startsWith("//") && !this.loaded.includes(addonId)
    );
    // Note: chrome.i18n.getUILanguage is not available Chrome 96-99
    const ui = (chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || navigator.language;
    const locales = [ui];
    if (ui.includes("-")) locales.push(ui.split("-")[0]);
    if (ui.startsWith("pt") && ui !== "pt-br") locales.push("pt-br");
    if (!locales.includes("en")) locales.push("en");

    localeLoop: for (const locale of locales) {
      for (const addonId of addonIds) {
        let resp;
        let messages = {};
        const url = `/addons-l10n/${locale}/${addonId}.json`;
        try {
          resp = await fetch(url);
          messages = await resp.json();
        } catch (_) {
          if (addonId === "_general") continue localeLoop;
          continue;
        }
        this.messages = Object.assign(messages, this.messages);
      }
    }
    this._reconfigure();
    this.loaded = this.loaded.concat(addonIds);

    // Store in local session cache
    chrome.storage.session?.set({ l10nCache: { messages: this.messages, loaded: this.loaded } }).catch((err) => {
      // No problem. Cache is not crucial.
      console.error(err);
    });
  }
}
