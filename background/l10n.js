import LocalizationProvider from "../libraries/l10n.js";

class BackgroundLocalizationProvider extends LocalizationProvider {
    constructor () {
        super();
        this.loaded = [];
    }
    
    async load (addonIds) {
        addonIds = ["_general", ...addonIds].filter(addonId => !this.loaded.includes(addonId));
        const ui = chrome.i18n.getUILanguage();
        const locales = [ui];
        if (ui.includes("-")) locales.push(ui.split("-")[0]);
        if (!locales.includes("en")) locales.push("en");
        
        for (const locale of locales) {
            for (const addonId of addonIds) {
                let resp;
                let messages = {};
                const url = `/addons-l10n/${locale}/${addonId}.json`;
                try {
                  resp = await fetch(url);
                  messages = await resp.json();
                } catch (_) {
                  continue;
                }
                this.messages = Object.assign(messages, this.messages);
            }
        }
        this._refreshDateTime();
        this.loaded.concat(addonIds);
    }
}