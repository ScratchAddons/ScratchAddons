export default class Popup {
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
        chrome.tabs.sendMessage(tabs[0].id, "getLocationHref", { frameId: 0 }, (url) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(url);
        });
      });
    });
  }
}
