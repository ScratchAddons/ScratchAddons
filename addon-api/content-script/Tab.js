export default class Tab {
  constructor() {
    this.clientVersion = document.querySelector("#app #navigation")
      ? "scratch-www"
      : window.Scratch
      ? "scratchr2"
      : null;
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
}
