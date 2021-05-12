import LocalizationProvider from "./cs/l10n.js";

export default class WebsiteLocalizationProvider extends LocalizationProvider {
  async loadByAddonId(addonId) {
    const translations = await new Promise((resolve) => chrome.runtime.sendMessage({ l10nAddonId: addonId }, resolve));
    this.messages = Object.assign(translations, this.messages);
    this._reconfigure();
  }
}
