import Trap from "./Trap.js";

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
    __scratchAddonsTraps.addEventListener("fakestatechanged", (e) => {
      const newEvent = new CustomEvent("fakestatechanged");
      newEvent.reducerOrigin = e.reducerOrigin;
      newEvent.path = e.path;
      newEvent.prev = e.prev;
      newEvent.next = e.next;
      this.dispatchEvent(newEvent);
    });
  }
  getScratchVM() {
    return scratchAddons.methods.getScratchVM();
  }
  waitForElement(selector) {
    if (!document.querySelector(selector)) {
      return new Promise((resolve) =>
        new MutationObserver(function (mutationsList, observer) {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve();
          }
        }).observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        })
      );
    } else {
      return Promise.resolve();
    }
  }
  /**
   * @type {string} editor mode (or empty string for non-editors).
   */
  get editorMode() {
    const pathname = location.pathname.toLowerCase();
    const split = pathname.split("/").filter(Boolean);
    if (!split[0] || split[0] !== "projects") return "";
    if (split.includes("editor")) return "editor";
    if (split.includes("fullscreen")) return "fullscreen";
    if (split.includes("embed")) return "embed";
    return "projectpage";
  }
}
