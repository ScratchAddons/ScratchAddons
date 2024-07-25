import LocalizationProvider from "./cs/l10n.js";

export default class WebsiteLocalizationProvider extends LocalizationProvider {
  async loadByAddonId(addonId) {
      // The value returned on await of `chrome.runtime.sendMessage` is only permited in Chrome 99+
    const translations = await new Promise((resolve) => chrome.runtime.sendMessage({ l10nAddonId: addonId }, resolve));
    this.messages = Object.assign(translations, this.messages);
    this._reconfigure();
  }
}
