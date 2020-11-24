import LocalizationProvider from "./l10n.js";

export default class WebsiteLocalizationProvider extends LocalizationProvider {
    async loadMessages (messages) {
        const translations = await new Promise(
            resolve => chrome.runtime.sendMessage({ messages }, resolve)
        );
        const keyValue = messages.reduce((acc, cur, idx) => {
            acc[cur] = translations[idx];
            return acc;
        }, {});
        this.messages = Object.assign(keyValue, this.messages);
        this._refreshDateTime();
        this._generateCache(keyValue);
    }
}