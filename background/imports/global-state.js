// Global state is a JSON object shared between all content scripts and the background page.
// It is abstracted through a proxy in order to easily detect changes that should trigger events.
// Content scripts cannot modify global state, but they can always read from it.
// Exception: authentication info is local state, but is stored here for historical reasons.

const _globalState = {
  auth: {
    isLoggedIn: false,
    username: null,
    userId: null,
    xToken: null,
    csrfToken: null,
    scratchLang: null,
  },
  addonSettings: {},
};

class StateProxy {
  constructor(name = "scratchAddons.globalState") {
    this.name = name;
  }
  get(target, key) {
    if (key === "_target") return target;
    if (typeof target[key] === "object" && target[key] !== null) {
      return new Proxy(target[key], new StateProxy(`${this.name}.${key}`));
    } else {
      return target[key];
    }
  }
  set(target, key, value) {
    const oldValue = target[key];
    target[key] = value;

    // We should only notify other contexts of this change if basic information,
    // such as addon settings, is already available in the global state object.
    if (scratchAddons.localState.allReady) {
      messageForAllTabs({ newGlobalState: _globalState });

      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        stateChange(this.name, key, value);
      }
    }

    return true;
  }
}

function messageForAllTabs(message) {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => tab.url && chrome.tabs.sendMessage(tab.id, message, () => void chrome.runtime.lastError))
  );
  scratchAddons.sendToPopups(message);
}

function stateChange(parentObjectPath, key, value) {
  const objectPath = `${parentObjectPath}.${key}`;
  const objectPathArr = objectPath.split(".").slice(2);
  console.log(`%c${objectPath}`, "font-weight: bold;", "is now: ", objectPathArr[0] === "auth" ? "[redacted]" : value);
  if (objectPathArr[0] === "addonSettings") {
    // Send event to userscripts, if they exist.
    messageForAllTabs({
      fireEvent: {
        target: "settings",
        name: "change",
        addonId: objectPathArr[1],
      },
    });
  }
}

export default new Proxy(_globalState, new StateProxy());
