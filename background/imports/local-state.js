// Local state is a JSON object where the background page stores data.
// It is abstracted through a proxy in order to easily detect changes that should trigger events or side effects.

const _localState = {
  ready: {
    auth: false,
    manifests: false,
    addonSettings: false,
  },
  allReady: false,
  addonsEnabled: {},
  badges: {},
};

class StateProxy {
  constructor(name = "scratchAddons.localState") {
    this.name = name;
  }
  /**
   * @param {{ [key: string]: any }} target
   * @param {string} key
   *
   * @returns {{ [key: string]: any } | string}
   */
  get(target, key) {
    if (key === "_target") return target;
    if (typeof target[key] === "object" && target[key] !== null) {
      return new Proxy(target[key], new StateProxy(`${this.name}.${key}`));
    } else {
      return target[key];
    }
  }

  /**
   * @param {{ [key: string]: any }} target
   * @param {string} key
   * @param {any} value
   */
  set(target, key, value) {
    const oldValue = target[key];
    target[key] = value;

    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      stateChange(this.name, key, value);
    }

    return true;
  }
}

/**
 * @param {string} parentObjectPath
 * @param {string} key
 * @param {any} value
 */
function stateChange(parentObjectPath, key, value) {
  const objectPath = `${parentObjectPath}.${key}`;
  const objectPathArr = objectPath.split(".").slice(2);
  console.log(`%c${objectPath}`, "font-weight: bold;", "is now: ", objectPathArr[0] === "auth" ? "[redacted]" : value);
  if (objectPathArr[0] === "ready" && Object.values(scratchAddons.localState?.ready || {}).every((x) => x === true)) {
    console.log("Everything ready!");
    _localState.allReady = true;
    scratchAddons.localEvents?.dispatchEvent(new CustomEvent("ready"));
  }
  if (objectPathArr[0] === "badges") {
    scratchAddons.localEvents?.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
  }
}

/** @type {_localState} */
// @ts-expect-error -- It doesn't know what properties are on it initially.
const proxy = new Proxy(_localState, new StateProxy());
export default proxy;
