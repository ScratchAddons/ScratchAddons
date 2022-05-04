import type { Addon } from "./common";

interface Popup {
  /**
   * Whether the popup is displayed fullscreen.
   */
  get isFullscreen(): boolean;
  /**
   * Whether the user has enabled light mode on Scratch Addons settings.
   */
  get isLightMode(): boolean;
  /**
   * Gets the URL of the Scratch page that is selected, or null.
   * @returns the URL
   */
  getSelectedTabURL(): Promise<string | void>;
}

export interface PopupAddon extends Addon {
  popup: Popup;
}
