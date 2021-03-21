import runAddonUserscripts from "./run-userscript.js";
import Localization from "./l10n.js";

window.scratchAddons = {};
scratchAddons.classNames = { loaded: false };

const pendingPromises = {};
pendingPromises.msgCount = [];

const comlinkIframe1 = document.getElementById("scratchaddons-iframe-1");
const comlinkIframe2 = document.getElementById("scratchaddons-iframe-2");
const comlinkIframe3 = document.getElementById("scratchaddons-iframe-3");
const comlinkIframe4 = document.getElementById("scratchaddons-iframe-4");
const _cs_ = Comlink.wrap(Comlink.windowEndpoint(comlinkIframe2.contentWindow, comlinkIframe1.contentWindow));

const page = {
  _globalState: null,
  get globalState() {
    return this._globalState;
  },
  set globalState(val) {
    const set = (this._globalState = val);
    scratchAddons.globalState = val;
    return set;
  },

  l10njson: null, // Only set once
  addonsWithUserscripts: null, // Only set once

  _dataReady: false,
  get dataReady() {
    return this._dataReady;
  },
  set dataReady(val) {
    const set = (this._dataReady = val);
    onDataReady(); // Assume set to true
    return set;
  },

  fireEvent(info) {
    if (info.addonId) {
      // Addon specific events, like settings change and self disabled
      const eventTarget = scratchAddons.eventTargets[info.target].find(
        (eventTarget) => eventTarget._addonId === info.addonId
      );
      if (eventTarget) eventTarget.dispatchEvent(new CustomEvent(info.name));
    } else {
      // Global events, like auth change
      scratchAddons.eventTargets[info.target].forEach((eventTarget) =>
        eventTarget.dispatchEvent(new CustomEvent(info.name))
      );
    }
  },
  setMsgCount({count}) {
    pendingPromises.msgCount.forEach((promiseResolver) => promiseResolver(count));
    pendingPromises.msgCount = [];
  },
};
Comlink.expose(page, Comlink.windowEndpoint(comlinkIframe4.contentWindow, comlinkIframe3.contentWindow));

function onDataReady() {
  const addons = page.addonsWithUserscripts;

  scratchAddons.l10n = new Localization(page.l10njson);
  scratchAddons.eventTargets = {
    auth: [],
    settings: [],
    tab: [],
    self: [],
  };

  scratchAddons.methods = {};
  scratchAddons.methods.getMsgCount = () => {
    // TODO: not sure why we do this (pending promises arr), just transitioning to comlink for now
    _cs_.requestMsgCount();
    let promiseResolver;
    const promise = new Promise((resolve) => (promiseResolver = resolve));
    pendingPromises.msgCount.push(promiseResolver);
    return promise;
  };
  scratchAddons.methods.copyImage = async (dataURL) => {
    return _cs_.copyImage(dataURL);
  };

  const runUserscripts = () => {
    for (const addon of addons) {
      if (addon.scripts.length) runAddonUserscripts(addon);
    }
  };

  // We guarantee document.head won't throw in userscripts
  // TODO: preload locals and files *before* head is available,
  // but run addons after <head> is added.
  if (document.head) runUserscripts();
  else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        runUserscripts();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  }
}

function bodyIsEditorClassCheck() {
  const pathname = location.pathname.toLowerCase();
  const split = pathname.split("/").filter(Boolean);
  if (!split[0] || split[0] !== "projects") return;
  if (split.includes("editor") || split.includes("fullscreen")) document.body.classList.add("sa-body-editor");
  else document.body.classList.remove("sa-body-editor");
}
if (!document.body) document.addEventListener("DOMContentLoaded", bodyIsEditorClassCheck);
else bodyIsEditorClassCheck();

const originalReplaceState = history.replaceState;
history.replaceState = function () {
  const oldUrl = location.href;
  const newUrl = new URL(arguments[2], document.baseURI).href;
  const returnValue = originalReplaceState.apply(history, arguments);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

const originalPushState = history.pushState;
history.pushState = function () {
  const oldUrl = location.href;
  const newUrl = new URL(arguments[2], document.baseURI).href;
  const returnValue = originalPushState.apply(history, arguments);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

function loadClasses() {
  scratchAddons.classNames.arr = [
    ...new Set(
      [...document.styleSheets]
        .filter(
          (styleSheet) =>
            !(
              styleSheet.ownerNode.textContent.startsWith(
                "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
              ) &&
              (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                styleSheet.ownerNode.textContent.includes("label_input-group_"))
            )
        )
        .map((e) => {
          try {
            return [...e.cssRules];
          } catch (e) {
            return [];
          }
        })
        .flat()
        .map((e) => e.selectorText)
        .filter((e) => e)
        .map((e) => e.match(/(([\w-]+?)_([\w-]+)_([\w\d-]+))/g))
        .filter((e) => e)
        .flat()
    ),
  ];
  scratchAddons.classNames.loaded = true;

  const fixPlaceHolderClasses = () =>
    document.querySelectorAll("[class*='scratchAddonsScratchClass/']").forEach((el) => {
      [...el.classList]
        .filter((className) => className.startsWith("scratchAddonsScratchClass"))
        .map((className) => className.substring(className.indexOf("/") + 1))
        .forEach((classNameToFind) =>
          el.classList.replace(
            `scratchAddonsScratchClass/${classNameToFind}`,
            scratchAddons.classNames.arr.find(
              (className) =>
                className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
            ) || `scratchAddonsScratchClass/${classNameToFind}`
          )
        );
    });

  fixPlaceHolderClasses();
  new MutationObserver(() => fixPlaceHolderClasses()).observe(document.documentElement, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

if (document.querySelector("title")) loadClasses();
else {
  const stylesObserver = new MutationObserver((mutationsList) => {
    console.log(mutationsList); // TODO: test
    if (document.querySelector("title")) {
      stylesObserver.disconnect();
      loadClasses();
    }
  });
  stylesObserver.observe(document.documentElement, { childList: true });
}
