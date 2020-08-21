window.scratchAddons = {};

scratchAddons.addons = [];

const _globalState = {};

_globalState.auth = {
  isLoggedIn: false,
  username: null,
  userId: null,
  xToken: null,
  sessionId: null,
  csrfToken: null,
};

class GlobalStateProxyHandler {
  constructor(name, target) {
    if (name) this.name = `${name}.`;
    else {
      this.name = "";
      this._target = target;
    }
  }
  get(target, key) {
    if (this.name === "" && key === "_target") return this._target;
    if (typeof target[key] === "object" && target[key] !== null) {
      return new Proxy(target[key], new GlobalStateProxyHandler(`${this.name}${key}`));
    } else {
      return target[key];
    }
  }
  set(target, key, value) {
    const oldValue = target[key];
    target[key] = value;
    messageForAllTabs({ newGlobalState: target });
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      const objectPath = `${this.name}${key}`.split(".");
      console.log("Global state changed!\n" + objectPath.join(".") + " is now:", value);
      if (objectPath[0] === "auth") {
        scratchAddons.eventTargets.auth.forEach((eventTarget) => eventTarget.dispatchEvent(new CustomEvent("change")));
        messageForAllTabs({ fireEvent: { target: "auth", name: "change" } });
      }
      if (objectPath[0] === "addonSettings" && objectPath[1]) {
        const settingsEventTarget = scratchAddons.eventTargets.settings.find(
          (eventTarget) => eventTarget._addonId === objectPath[1]
        );
        if (settingsEventTarget) settingsEventTarget.dispatchEvent(new CustomEvent("change"));
        messageForAllTabs({
          fireEvent: {
            target: "settings",
            name: "change",
            addonId: objectPath[1],
          },
        });
      }
    }
    return true;
  }
}

scratchAddons.globalState = new Proxy(_globalState, new GlobalStateProxyHandler(null, _globalState));
console.log("Global state initialized!\n", JSON.parse(JSON.stringify(scratchAddons.globalState)));

scratchAddons.eventTargets = {
  auth: [],
  settings: [],
};

scratchAddons.methods = {};

function messageForAllTabs(message) {
  chrome.tabs.query({}, (tabs) => tabs.forEach((tab) => tab.url && chrome.tabs.sendMessage(tab.id, message)));
}
