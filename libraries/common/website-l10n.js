import LocalizationProvider from "./cs/l10n.js";

/** Class for loading translations on pages that can perform IPC, such as popups or settings page. */
export default class WebsiteLocalizationProvider extends LocalizationProvider {
  /**
   * Loads translations by addon ID.
   *
   * @param {string} addonId The addon ID.
   * @returns {Promise}
   */
  async loadByAddonId(addonId) {
    const translations = await new Promise((resolve) => chrome.runtime.sendMessage({ l10nAddonId: addonId }, resolve));
    this.messages = Object.assign(translations, this.messages);
    this._reconfigure();
  }
}
