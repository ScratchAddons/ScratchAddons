const _localState = {
  get allReady() {
    return Object.values(scratchAddons.localState.ready).every((x) => x === true);
  },
};
_localState.ready = {
  auth: false,
  manifests: false,
  addonSettings: false,
};
_localState.badges = {};

class LocalStateProxyHandler {
  constructor(name) {
    if (name) this.name = `${name}.`;
    else this.name = "";
  }
  get(target, key) {
    if (typeof target[key] === "object" && target[key] !== null) {
      return new Proxy(target[key], new LocalStateProxyHandler(`${this.name}${key}`));
    } else {
      return target[key];
    }
  }
  set(target, key, value) {
    const oldValue = target[key];
    target[key] = value;
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      const objectPath = `${this.name}${key}`.split(".");
      console.log("Local state changed!\n" + objectPath.join(".") + " is now:", value);
      if (objectPath[0] === "ready" && scratchAddons.localState.allReady) {
        console.log("Everything ready!");
        window.dispatchEvent(new CustomEvent("scratchaddonsready"));
      }
    }
    return true;
  }
}

scratchAddons.localState = new Proxy(_localState, new LocalStateProxyHandler());
console.log("Local state initialized!\n", JSON.parse(JSON.stringify(scratchAddons.localState)));
