import runAddonUserscripts from "./run-userscript.js";
import Localization from "./l10n.js";
import "/libraries/thirdparty/cs/comlink.js";

window.scratchAddons = {};
scratchAddons.classNames = { loaded: false };
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
  self: [],
};
scratchAddons.session = {};
scratchAddons.loadedScripts = {};
const consoleOutput = (logAuthor = "[page]") => {
  const style = {
    // Remember to change these as well on cs.js
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};
scratchAddons.console = {
  log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
  warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
  error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
  logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
  warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
  errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
};

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
    this._globalState = scratchAddons.globalState = val;
  },

  l10njson: null, // Only set once
  addonsWithUserscripts: null, // Only set once

  _dataReady: false,
  get dataReady() {
    return this._dataReady;
  },
  set dataReady(val) {
    this._dataReady = val;
    onDataReady(); // Assume set to true
    this.refetchSession();
  },

  runAddonUserscripts, // Gets called by cs.js when addon enabled late

  fireEvent(info) {
    if (info.addonId) {
      if (info.name === "disabled") {
        document.documentElement.style.setProperty(
          `--${info.addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-_displayNoneWhileDisabledValue`,
          "none"
        );
      } else if (info.name === "reenabled") {
        document.documentElement.style.removeProperty(
          `--${info.addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-_displayNoneWhileDisabledValue`
        );
      }

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
  isFetching: false,
  async refetchSession() {
    if (location.origin === "https://scratchfoundation.github.io" || location.port === "8601") return;
    let res;
    let d;
    if (this.isFetching) return;
    this.isFetching = true;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._refresh());
    try {
      res = await fetch("/session/", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      d = await res.json();
    } catch (e) {
      d = {};
      scratchAddons.console.warn("Session fetch failed: ", e);
      if ((res && !res.ok) || !res) setTimeout(() => this.refetchSession(), 60000);
    }
    scratchAddons.session = d;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._update(d));
    this.isFetching = false;
  },
};
Comlink.expose(page, Comlink.windowEndpoint(comlinkIframe4.contentWindow, comlinkIframe3.contentWindow));

class SharedObserver {
  constructor() {
    this.inactive = true;
    this.pending = new Set();
    this.observer = new MutationObserver((mutation, observer) => {
      for (const item of this.pending) {
        if (item.condition && !item.condition()) continue;
        for (const match of document.querySelectorAll(item.query)) {
          if (item.seen?.has(match)) continue;
          if (item.elementCondition && !item.elementCondition(match)) continue;
          item.seen?.add(match);
          this.pending.delete(item);
          item.resolve(match);
          break;
        }
      }
      if (this.pending.size === 0) {
        this.inactive = true;
        this.observer.disconnect();
      }
    });
  }

  /**
   * Watches an element.
   * @param {object} opts - options
   * @param {string} opts.query - query.
   * @param {WeakSet=} opts.seen - a WeakSet that tracks whether an element has already been seen.
   * @param {function=} opts.condition - a function that returns whether to resolve the selector or not.
   * @param {function=} opts.elementCondition - A function that returns whether to resolve the selector or not, given an element.
   * @returns {Promise<Node>} Promise that is resolved with modified element.
   */
  watch(opts) {
    if (this.inactive) {
      this.inactive = false;
      this.observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
      });
    }
    return new Promise((resolve) =>
      this.pending.add({
        resolve,
        ...opts,
      })
    );
  }
}

function onDataReady() {
  const addons = page.addonsWithUserscripts;

  scratchAddons.l10n = new Localization(page.l10njson);

  scratchAddons.methods = {};
  scratchAddons.methods.copyImage = async (dataURL) => {
    return _cs_.copyImage(dataURL);
  };
  scratchAddons.methods.getEnabledAddons = (tag) => _cs_.getEnabledAddons(tag);

  scratchAddons.sharedObserver = new SharedObserver();

  const runUserscripts = () => {
    for (const addon of addons) {
      if (addon.scripts.length) runAddonUserscripts(addon);
    }
  };

  // Note: we currently load userscripts and locales after head loaded
  // We could do that before head loaded just fine, as long as we don't
  // actually *run* the addons before document.head is defined.
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
  if (location.origin === "https://scratchfoundation.github.io" || location.port === "8601")
    return document.body.classList.add("sa-body-editor");
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
  const newUrl = arguments[2] ? new URL(arguments[2], document.baseURI).href : oldUrl;
  const returnValue = originalReplaceState.apply(history, arguments);
  _cs_.url = newUrl;
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

const originalPushState = history.pushState;
history.pushState = function () {
  const oldUrl = location.href;
  const newUrl = arguments[2] ? new URL(arguments[2], document.baseURI).href : oldUrl;
  const returnValue = originalPushState.apply(history, arguments);
  _cs_.url = newUrl;
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

// replaceState or pushState will not trigger onpopstate.
window.addEventListener("popstate", () => {
  const newUrl = (_cs_.url = location.href);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    // There isn't really a way to get the previous URL from popstate event.
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl: "", newUrl } }));
  }
  bodyIsEditorClassCheck();
});

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
  window.dispatchEvent(new CustomEvent("scratchAddonsClassNamesReady"));
}

const isProject =
  location.pathname.split("/")[1] === "projects" &&
  !["embed", "remixes", "studios"].includes(location.pathname.split("/")[3]);
const isScratchGui = location.origin === "https://scratchfoundation.github.io" || location.port === "8601";
if (isScratchGui || isProject) {
  // Stylesheets are considered to have loaded if this element exists
  const elementSelector = isScratchGui ? "div[class*=index_app_]" : ":root > body > .ReactModalPortal";

  if (document.querySelector(elementSelector)) loadClasses();
  else {
    let foundElement = false;
    const stylesObserver = new MutationObserver((mutationsList) => {
      if (document.querySelector(elementSelector)) {
        foundElement = true;
        stylesObserver.disconnect();
        loadClasses();
      }
    });
    stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      if (!foundElement) scratchAddons.console.log("Did not find elementSelector element after 10 seconds.");
    }, 10000);
  }
}

if (location.pathname === "/discuss/3/topic/add/") {
  const checkUA = () => {
    if (!window.mySettings) return false;
    const ua = window.mySettings.markupSet.find((x) => x.className);
    ua.openWith = window._simple_http_agent = ua.openWith.replace("version", "versions");
    const textarea = document.getElementById("id_body");
    if (textarea?.value) {
      textarea.value = ua.openWith;
      return true;
    }
  };
  if (!checkUA()) window.addEventListener("DOMContentLoaded", () => checkUA(), { once: true });
}
