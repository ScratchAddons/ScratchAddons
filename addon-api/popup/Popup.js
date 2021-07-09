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
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
          url: "https://scratch.mit.edu/*",
        },
        (tabs) => resolve(tabs.find((tab) => tab.url)?.url || null)
      );
    });
  }
}
