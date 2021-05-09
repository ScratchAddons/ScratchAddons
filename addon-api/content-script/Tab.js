import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import Listenable from "../common/Listenable.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
import getWorkerScript from "./worker.js";

const DATA_PNG = "data:image/png;base64,";

/**
 * APIs specific to userscripts.
 * @extends Listenable
 * @property {?string} clientVersion - version of the renderer (scratch-www, scratchr2, etc)
 * @property {Trap} traps
 * @property {ReduxHandler} redux
 */
export default class Tab extends Listenable {
  constructor(info) {
    super();
    this._addonId = info.id;
    this.clientVersion = document.querySelector("meta[name='format-detection']")
      ? "scratch-www"
      : document.querySelector("script[type='text/javascript']")
      ? "scratchr2"
      : null;
    this.traps = new Trap(this);
    this.redux = new ReduxHandler();
    this._waitForElementSet = new WeakSet();
  }
  /**
   * Loads a script by URL.
   * @param {string} url - script URL.
   * @returns {Promise}
   */
  loadScript(url) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = url;
      document.head.appendChild(script);
      script.onload = resolve;
    });
  }
  /**
   * Waits until an element renders, then return the element.
   * @param {string} selector - argument passed to querySelector.
   * @param {object} opts - options.
   * @param {boolean=} opts.markAsSeen - Whether it should mark resolved elements to be skipped next time or not.
   * @param {function=} opts.condition - A function that returns whether to resolve the selector or not.
   * @param {function=} opts.reduxCondition - A function that returns whether to resolve the selector or not.
   * Use this as an optimization and do not rely on the behavior.
   * @param {string[]=} opts.reduxEvents - An array of redux events that must be dispatched before resolving the selector.
   * Use this as an optimization and do not rely on the behavior.
   * @returns {Promise<Element>} - element found.
   */
  waitForElement(selector, opts = {}) {
    const markAsSeen = !!opts.markAsSeen;
    if (!opts.condition || opts.condition()) {
      const firstQuery = document.querySelectorAll(selector);
      for (const element of firstQuery) {
        if (this._waitForElementSet.has(element)) continue;
        if (markAsSeen) this._waitForElementSet.add(element);
        return Promise.resolve(element);
      }
    }
    const { reduxCondition, condition } = opts;
    let listener;
    let combinedCondition = () => {
      if (condition && !condition()) return false;
      if (this.redux.state) {
        if (reduxCondition && !reduxCondition(this.redux.state)) return false;
      }
      // NOTE: this may reach sooner than expected, if redux state is not available
      // because of timing issues. However this is just an optimization! It's fine
      // if it runs a little earlier. Just don't error out.
      return true;
    };
    if (opts.reduxEvents) {
      const oldCondition = combinedCondition;
      let satisfied = false;
      combinedCondition = () => {
        if (oldCondition && !oldCondition()) return false;
        return satisfied;
      };
      listener = ({ detail }) => {
        if (opts.reduxEvents.includes(detail.action.type)) {
          satisfied = true;
        }
      };
      this.redux.initialize();
      this.redux.addEventListener("statechanged", listener);
    }
    const promise = scratchAddons.sharedObserver.watch({
      query: selector,
      seen: markAsSeen ? this._waitForElementSet : null,
      condition: combinedCondition,
    });
    if (listener) {
      promise.then((match) => {
        this.redux.removeEventListener("statechanged", listener);
        return match;
      });
    }
    return promise;
  }
  /**
   * editor mode (or null for non-editors).
   * @type {?string}
   */
  get editorMode() {
    const pathname = location.pathname.toLowerCase();
    const split = pathname.split("/").filter(Boolean);
    if (!split[0] || split[0] !== "projects") return null;
    if (split.includes("editor")) return "editor";
    if (split.includes("fullscreen")) return "fullscreen";
    if (split.includes("embed")) return "embed";
    return "projectpage";
  }

  /**
   * Copies an PNG image.
   * @param {string} dataURL - data url of the png image
   * @returns {Promise}
   */
  copyImage(dataURL) {
    if (!dataURL.startsWith(DATA_PNG)) return Promise.reject(new TypeError("Expected PNG data URL"));
    if (typeof Clipboard.prototype.write === "function") {
      // Chrome
      const blob = dataURLToBlob(dataURL);
      const items = [
        new ClipboardItem({
          "image/png": blob,
        }),
      ];
      return navigator.clipboard.write(items);
    } else {
      // Firefox needs Content Script
      return scratchAddons.methods.copyImage(dataURL).catch((err) => {
        return Promise.reject(new Error(`Error inside clipboard handler: ${err}`));
      });
    }
  }

  /**
   * Gets translation used by Scratch.
   * @param {string} key - Translation key.
   * @returns {string} Translation.
   */
  scratchMessage(key) {
    if (this.clientVersion === "scratch-www") {
      const locales = [window._locale ? window._locale.toLowerCase() : "en"];
      if (locales[0].includes("-")) locales.push(locales[0].split("-")[0]);
      if (locales.includes("pt") && !locales.includes("pt-br")) locales.push("pt-br");
      if (!locales.includes("en")) locales.push("en");
      for (const locale of locales) {
        if (window._messages[locale] && window._messages[locale][key]) {
          return window._messages[locale][key];
        }
      }
      console.warn("Unknown key: ", key);
      return "";
    }
    if (this.clientVersion === "scratchr2") {
      return window.django.gettext(key);
    }
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "tab";
  }

  /**
   * Loads a Web Worker.
   * @async
   * @param {string} url - URL of the worker to load.
   * @returns {Promise<Worker>} - worker.
   */
  async loadWorker(url) {
    const resp = await fetch(url);
    const script = await resp.text();
    const workerScript = getWorkerScript(this, script, url);
    const blob = new Blob([workerScript], { type: "text/javascript" });
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);
    return new Promise((resolve) => worker.addEventListener("message", () => resolve(worker), { once: true }));
  }

  /**
   * Gets the hashed class name for a Scratch stylesheet class name.
   * @param {...*} args Unhashed class names.
   * @param {object} opts - options.
   * @param {String[]|String} opts.others - Non-Scratch class or classes to merge.
   * @returns {string} Hashed class names.
   */
  scratchClass(...args) {
    let res = "";
    args
      .filter((arg) => typeof arg === "string")
      .forEach((classNameToFind) => {
        if (scratchAddons.classNames.loaded) {
          res +=
            scratchAddons.classNames.arr.find(
              (className) =>
                className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
            ) || "";
        } else {
          res += `scratchAddonsScratchClass/${classNameToFind}`;
        }
        res += " ";
      });
    if (typeof args[args.length - 1] === "object") {
      const options = args[args.length - 1];
      const classNames = Array.isArray(options.others) ? options.others : [options.others];
      classNames.forEach((string) => (res += string + " "));
    }
    res = res.slice(0, -1);
    // Sanitize just in case
    res = res.replace(/"/g, "");
    return res;
  }

  displayNoneWhileDisabled(el, { display = "" } = {}) {
    el.style.display = `var(--${this._addonId.replace(/-([a-z])/g, (g) =>
      g[1].toUpperCase()
    )}-_displayNoneWhileDisabledValue${display ? ", " : ""}${display})`;
  }
}
