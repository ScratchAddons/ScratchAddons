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
}
