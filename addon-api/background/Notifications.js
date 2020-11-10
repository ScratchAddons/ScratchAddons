export default class Notifications extends EventTarget {
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
    } else newOpts = opts;
    newOpts.contextMessage = "Scratch Addons";
    return new Promise((resolve) => {
      chrome.notifications.create(notifId, newOpts, (callback) => resolve(callback));
    });
  }
  update(...args) {
    return new Promise((resolve) => {
      chrome.notifications.update(...args, (callback) => resolve(callback));
    });
  }
  clear(...args) {
    return new Promise((resolve) => {
      chrome.notifications.clear(...args, (callback) => resolve(callback));
    });
  }
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
  get muted() {
    return scratchAddons.muted;
  }
  _removeEventListeners() {
    chrome.notifications.onClicked.removeListener(this._onClicked);
    chrome.notifications.onClosed.removeListener(this._onClosed);
    chrome.notifications.onButtonClicked.removeListener(this._onButtonClicked);
  }
}
