export default class Popup {
  constructor(addon) {
    this._addonId = addon.self.id;
  }

  /**
   * Whether the popup is displayed fullscreen.
   * @type {boolean}
   */
  get isFullscreen() {
    return window.parent === window;
  }

  /**
   * Whether the user has enabled light mode on Scratch Addons settings.
   * @type {boolean}
   */
  get isLightMode() {
    return scratchAddons.isLightMode;
  }

  /**
   * Gets the URL of the Scratch page that is selected, or null.
   * @returns {Promise<?string>} - the URL
   */
  getSelectedTabUrl() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return resolve(null);
        return resolve(tabs[0]?.url || null);
      });
    });
  }

  /**
   * Changes the settings of this addon.
   * @param {object} settings the settings to merge to current
   */
  changeSettings(settings = {}) {
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const unknownKeys = Object.keys(settings).filter((key) => !Object.prototype.hasOwnProperty.call(settingsObj, key));
    if (unknownKeys.length) {
      throw new Error(`Unknown setting keys passed: ${unknownKeys}`);
    }
    chrome.runtime.sendMessage({
      changeAddonSettings: {
        addonId: this._addonId,
        newSettings: { ...settingsObj, ...settings },
      },
    });
  }
}
