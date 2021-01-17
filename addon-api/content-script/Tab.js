import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import Listenable from "../common/Listenable.js";
import dataURLToBlob from "../../libraries/data-url-to-blob.js";
import getWorkerScript from "./worker.js";

const DATA_PNG = "data:image/png;base64,";
const template = document.getElementById("scratch-addons");

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
   * @returns {Promise<Element>} - element found.
   */
  waitForElement(selector, opts = {}) {
    const markAsSeen = !!opts.markAsSeen;
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
        attributes: false,
        childList: true,
        subtree: true,
      })
    );
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
      template.setAttribute("data-clipboard-image", dataURL);
      return this.waitForElement("[data-clipboard]").then((el) => {
        const attr = el.dataset.clipboard;
        el.removeAttribute("data-clipboard");
        if (attr === "success") return Promise.resolve();
        return Promise.reject(new Error(`Error inside clipboard handler: ${attr}`));
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
      return window._messages[window._locale][key] || key;
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
    const blob = new Blob([workerScript], {type: "text/javascript"});
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);
    return new Promise((resolve) => worker.addEventListener("message", () => resolve(worker), { once: true }));
  }
}
