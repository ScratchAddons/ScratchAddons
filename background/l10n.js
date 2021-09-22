import LocalizationProvider from "../libraries/common/cs/l10n.js";

const ui = chrome.i18n.getUILanguage().toLowerCase();
const locales = [ui];
if (ui.includes("-")) locales.push(ui.split("-")[0]);
if (ui.startsWith("pt") && ui !== "pt-br") locales.push("pt-br");
if (!locales.includes("en")) locales.push("en");
locales.splice(locales.indexOf("en") + 1)

export default class BackgroundLocalizationProvider extends LocalizationProvider {
  constructor() {
    super();
    this.loaded = [];
  }

  async load(addonIds) {
    addonIds = ["_general", ...addonIds].filter(
      (addonId) => !addonId.startsWith("//") && !this.loaded.includes(addonId)
    );

    const localePromises = locales.map(async (locale) => {
      let skip = [];

      const localePromises = addonIds.map(async (addonId) => {
        if (skip[locale]) return;
        const url = chrome.runtime.getURL(`addons-l10n/${locale}/${addonId}.json`);
        let res;
        const messages = await fetch(url)
          .then((resp) => {
            res = resp;
            return resp.json();
          })
          .catch((e) => {
            if (addonId === "_general") skip[locale] = true;
            if (res?.status !== 404) console.error(e);
          });

        return messages;
      });

      return Object.assign(
        {},
        ...(await Promise.all(localePromises)).filter((addon) => addon) // filter out undefined values
      );
    });

    this.messages = Object.assign({}, ...(await Promise.all(localePromises)).reverse());

    this._reconfigure();
    this.loaded = this.loaded.concat(addonIds);
  }
}
