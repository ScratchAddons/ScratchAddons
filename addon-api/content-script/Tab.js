import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import dataURLToBlob from "../../libraries/data-url-to-blob.js";

const DATA_PNG = "data:image/png;base64,";
const template = document.getElementById("scratch-addons");

export default class Tab extends EventTarget {
  constructor() {
    super();
    if (scratchAddons.eventTargets) scratchAddons.eventTargets.tab.push(this);
    this.clientVersion = document.querySelector("#app #navigation")
      ? "scratch-www"
      : window.Scratch
      ? "scratchr2"
      : null;
    this.traps = new Trap();
    __scratchAddonsTraps.addEventListener("fakestatechanged", ({ detail }) => {
      const newEvent = new CustomEvent("fakestatechanged", {
        detail: {
          reducerOrigin: detail.reducerOrigin,
          path: detail.path,
          prev: detail.prev,
          next: detail.next,
        },
      });
      this.dispatchEvent(newEvent);
    });
    this.redux = new ReduxHandler();
  }
  getScratchVM() {
    return scratchAddons.methods.getScratchVM();
  }
  waitForElement(selector) {
    if (!document.querySelector(selector)) {
      return new Promise((resolve) =>
        new MutationObserver(function (mutationsList, observer) {
          const elem = document.querySelector(selector);
          if (elem) {
            observer.disconnect();
            resolve(elem);
          }
        }).observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        })
      );
    } else {
      return Promise.resolve(document.querySelector(selector));
    }
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
