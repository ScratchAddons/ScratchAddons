import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import dataURLToBlob from "../../libraries/data-url-to-blob.js";

const DATA_PNG = "data:image/png;base64,";
const template = document.getElementById("scratch-addons");

export default class Tab extends EventTarget {
  constructor(info) {
    super();
    scratchAddons.eventTargets.tab.push(this);
    this.clientVersion = document.querySelector("meta[name='format-detection']")
      ? "scratch-www"
      : document.querySelector("script[type='text/javascript']")
      ? "scratchr2"
      : null;
    this.traps = new Trap();
    if (window.__scratchAddonsTraps)
      __scratchAddonsTraps.addEventListener("fakestatechanged", ({ detail }) => {
        const newEvent = new CustomEvent("fakestatechanged", {
          detail: {
            reducerOrigin: detail.reducerOrigin,
            path: detail.path,
            prev: detail.prev,
            next: detail.next,
          },
        });
        this.traps.dispatchEvent(newEvent);
      });
    this.redux = new ReduxHandler();
    this._waitForElementSet = new WeakSet();
  }
  loadScript(url) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = url;
      document.head.appendChild(script);
      script.onload = resolve;
    });
  }
  getScratchVM() {
    return scratchAddons.methods.getScratchVM();
  }
  waitForElement(selector, { markAsSeen = false } = {}) {
    const firstQuery = document.querySelectorAll(selector);
    for (const element of firstQuery) {
      if (this._waitForElementSet.has(element)) continue;
      if (markAsSeen) this._waitForElementSet.add(element);
      return Promise.resolve(element);
    }
    return new Promise((resolve) =>
      new MutationObserver((mutationsList, observer) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (this._waitForElementSet.has(element)) continue;
          observer.disconnect();
          resolve(element);
          if (markAsSeen) this._waitForElementSet.add(element);
          break;
        }
      }).observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
      })
    );
  }
  /**
   * @type {?string} editor mode (or null for non-editors).
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
   * Copy an PNG image.
   * @param {string} dataURL data url of the png image
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
      template.setAttribute("data-clipboard-image", dataURL);
      return this.waitForElement("[data-clipboard]").then((el) => {
        const attr = el.dataset.clipboard;
        el.removeAttribute("data-clipboard");
        if (attr === "success") return Promise.resolve();
        return Promise.reject(new Error(`Error inside clipboard handler: ${attr}`));
      });
    }
  }
}
