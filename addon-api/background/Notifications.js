import Listenable from "../common/Listenable.js";

/** Handles notifications. */
export default class Notifications extends Listenable {
  /** @param {import("Addon.js").default} addonObject */
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;

    /** @param {string} notifId */
    this._onClicked = (notifId) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("click", {
            detail: {
              id: notifId,
            },
          })
        );
      }
    };

    /** @param {string} notifId */
    this._onClosed = (notifId) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("close", {
            detail: {
              id: notifId,
            },
          })
        );
      }
    };

    /**
     * @param {string} notifId
     * @param {number} buttonIndex
     */
    this._onButtonClicked = (notifId, buttonIndex) => {
      if (notifId.startsWith(this._addonId)) {
        this.dispatchEvent(
          new CustomEvent("buttonclick", {
            detail: {
              id: notifId,
              buttonIndex,
            },
          })
        );
      }
    };
    chrome.notifications.onClicked.addListener(this._onClicked);
    chrome.notifications.onClosed.addListener(this._onClosed);
    chrome.notifications.onButtonClicked.addListener(this._onButtonClicked);
  }
  /**
   * Creates a notification.
   *
   * @param {chrome.notifications.NotificationOptions} opts - Options.
   */
  create(opts) {
    if (typeof opts !== "object") {
      throw "ScratchAddons exception: do not specify a notification ID.";
    }
    if (scratchAddons.muted) return Promise.resolve(null);
    const notifId = `${this._addonId}__${Date.now()}`;
    /** @type {opts} */
    let newOpts;
    if (typeof InstallTrigger !== "undefined") {
      newOpts = JSON.parse(JSON.stringify(opts));
      // On Firefox, remove notification properties that throw.
      delete newOpts.buttons;
      delete newOpts.requireInteraction;
      delete newOpts.silent;
    } else newOpts = opts;
    newOpts.contextMessage = chrome.i18n.getMessage("extensionName");
    return new Promise((resolve) => {
      chrome.notifications.create(notifId, newOpts, (callback) => resolve(callback));
    });
  }
  /**
   * Updates existing notifications.
   *
   * @param {string} notificationId
   * @param {chrome.notifications.NotificationOptions} options
   * @param {(wasUpdated: boolean) => void} [callback]
   *
   * @returns {Promise<boolean | void>}
   */
  update(notificationId, options, callback) {
    return new Promise((resolve) => {
      chrome.notifications.update(notificationId, options, callback ?? ((callback) => resolve(callback)));
    });
  }
  /**
   * Clears existing notifications.
   *
   * @param {string} notificationId
   * @param {(wasCleared: boolean) => void} [callback]
   *
   * @returns {Promise<boolean | void>}
   */
  clear(notificationId, callback) {
    return new Promise((resolve) => {
      chrome.notifications.clear(notificationId, callback ?? ((callback) => resolve(callback)));
    });
  }
  /**
   * Gets all notifications from the addon.
   *
   * @returns {Promise<{ [key: string]: { [key: string]: any } }>} - Notifications found.
   */
  getAll() {
    return new Promise((resolve) => {
      chrome.notifications.getAll(
        /** @param {{ [key: string]: any }} notifications */ (notifications) => {
          const notifIds = Object.keys(notifications).filter((notifId) => notifId.startsWith(this._addonId));
          /** @type {{ [key: string]: { [key: string]: any } }} */
          const obj = {};
          for (const notifId of notifIds) {
            obj[notifId] = notifications[notifId];
          }
          resolve(obj);
        }
      );
    });
  }
  /**
   * Whether notifications are muted or not.
   *
   * @type {boolean}
   */
  get muted() {
    return scratchAddons.muted;
  }
  dispose() {
    chrome.notifications.onClicked.removeListener(this._onClicked);
    chrome.notifications.onClosed.removeListener(this._onClosed);
    chrome.notifications.onButtonClicked.removeListener(this._onButtonClicked);
  }
}
