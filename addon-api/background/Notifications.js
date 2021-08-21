import Listenable from "../common/Listenable.js";

/**
 * Handles notifications.
 * @extends Listenable
 */
export default class Notifications extends Listenable {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;

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
   * @param {object} opts - options
   * @param {Array.<{title: string}>=} opts.buttons - buttons to be displayed.
   * @param {boolean=} opts.silent - whether the notification should play system notification sound or not.
   * @param {string} opts.type - type of the notification, usually "basic".
   * @param {string} opts.title - title of the notification.
   * @param {string} opts.iconUrl - URL of the icon to be displayed.
   * @param {string} opts.message - message to be displayed.
   * @returns {Promise}
   */
  create(opts, callback) {
    if (typeof opts !== "object") {
      throw "ScratchAddons exception: do not specify a notification ID.";
    }
    if (scratchAddons.muted) return Promise.resolve(null);
    const notifId = `${this._addonId}__${Date.now()}`;
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
   * @returns {Promise}
   */
  update(...args) {
    return new Promise((resolve) => {
      chrome.notifications.update(...args, (callback) => resolve(callback));
    });
  }
  /**
   * Clears existing notifications.
   * @returns {Promise}
   */
  clear(...args) {
    return new Promise((resolve) => {
      chrome.notifications.clear(...args, (callback) => resolve(callback));
    });
  }
  /**
   * Gets all notifications from the addon.
   * @returns {Promise<object[]>} - notifications found.
   */
  getAll() {
    return new Promise((resolve) => {
      chrome.notifications.getAll((notifications) => {
        const notifIds = Object.keys(notifications).filter((notifId) => notifId.startsWith(this._addonId));
        const obj = {};
        for (const notifId of notifIds) {
          obj[notifId] = notifications[notifId];
        }
        resolve(obj);
      });
    });
  }
  /**
   * Whether notifications are muted or not.
   * @type {boolean}
   */
  get muted() {
    return scratchAddons.muted;
  }
  dispose() {
    // While for the rest of the code the callee can assume that notifications permission
    // is granted, this is not always the case e.g. when revoking optional permission on
    // Firefox while the addon is enabled, this will be called during changeAddonState.
    if (chrome.notifications) {
      chrome.notifications.onClicked.removeListener(this._onClicked);
      chrome.notifications.onClosed.removeListener(this._onClosed);
      chrome.notifications.onButtonClicked.removeListener(this._onButtonClicked);
    }
  }
}
