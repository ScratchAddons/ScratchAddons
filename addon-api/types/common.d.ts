/**
 * Wrapper class for EventTarget.
 */
export interface Listenable<E> extends EventTarget {
  addEventListener(
    eventName: E,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    eventName: E,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * Represents information about the addon.
 */
interface Self extends Listenable<"disabled" | "reenabled"> {
  /**
   * The addon's ID.
   */
  id: string;
  /**
   * The browser the extension is running in.
   */
  browser: "chrome" | "firefox";
  /**
   * Whether the addon is disabled or not.
   */
  disabled: boolean;
  /**
   * Whether the addon was enabled late or not.
   */
  enabledLate: boolean;
  /**
   * The path to the addon's directory.
   */
  get dir(): string;
  /**
   * The path to the libraries directory.
   */
  get lib(): string;
  /**
   * Gets a list of addon IDs enabled, optionally filtered using tags.
   * @param tag - the tag for filtering.
   * @returns enabled addons' IDs.
   */
  getEnabledAddons(tag?: string): Promise<string[]>;
}

/**
 * Authentication related utilities.
 */
interface Auth extends Listenable<"change"> {
  /**
   * Fetch whether the user is logged in or not
   * @returns whether the user is logged in or not.
   */
  fetchIsLoggedIn(): Promise<boolean>;
  /**
   * Fetch current username.
   * @returns the username.
   */
  fetchUserName(): Promise<?string>;
  /**
   * Fetch current user ID.
   * @returns the user ID.
   */
  fetchUserId(): Promise<?number>;
  /**
   * Fetch X-Token used in new APIs.
   * @returns the X-Token.
   */
  fetchXToken(): Promise<?string>;
  /**
   * CSRF token used in APIs
   */
  get csrfToken(): string;
  /**
   * Language of the Scratch website.
   */
  get scratchLang(): string;
}

interface Settings extends Listenable<"change"> {
  /**
   * Gets a setting.
   * @param optionName - ID of the settings.
   * @throws settings ID is invalid.
   * @returns setting.
   */
  get(optionName: string): any;
}

/**
 * An addon.
 */
export interface Addon {
  self: Self;
  auth: Auth;
  settings: Settings;
}
