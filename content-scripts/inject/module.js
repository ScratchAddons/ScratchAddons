import Tab from "../../addon-api/content-script/Tab.js";
import runAddonUserscripts from "./run-userscript.js";
import Localization from "./l10n.js";

window.scratchAddons = {};
scratchAddons.classNames = { loaded: false };
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
  self: [],
};

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
  setMsgCount({ count }) {
    pendingPromises.msgCount.forEach((promiseResolver) => promiseResolver(count));
    pendingPromises.msgCount = [];
  },
};
Comlink.expose(page, Comlink.windowEndpoint(comlinkIframe4.contentWindow, comlinkIframe3.contentWindow));

class SharedObserver {
  constructor() {
    this.inactive = true;
    this.pending = new Set();
    this.observer = new MutationObserver((mutation, observer) => {
      for (const item of this.pending) {
        for (const match of document.querySelectorAll(item.query)) {
          if (item.seen) {
            if (item.seen.has(match)) continue;
            item.seen.add(match);
          }
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

async function onDataReady() {
  const addons = page.addonsWithUserscripts;

  scratchAddons.l10n = new Localization(page.l10njson);

  scratchAddons.methods = {};
  scratchAddons.methods.getMsgCount = () => {
    if (!pendingPromises.msgCount.length) _cs_.requestMsgCount();
    let promiseResolver;
    const promise = new Promise((resolve) => (promiseResolver = resolve));
    pendingPromises.msgCount.push(promiseResolver);
    return promise;
  };
  scratchAddons.methods.copyImage = async (dataURL) => {
    return _cs_.copyImage(dataURL);
  };

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

  const exampleTab = new Tab({});
  if (exampleAddon.editorMode === "editor") inject(await exampleTab.traps.getBlockly());
  exampleTab.addEventListener(
    "urlChange",
    async () => exampleTab.editorMode === "editor" && inject(await exampleTab.traps.getBlockly())
  );
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
    if (document.querySelector("title")) {
      stylesObserver.disconnect();
      loadClasses();
    }
  });
  stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
}

let injected = false;
function inject(Blockly) {
  if (injected) return;
  injected = true;
  let oldShow = Blockly.ContextMenu.show;
  Blockly.ContextMenu.show = function (event, items, something) {
    let target = event.target;
    let block = target.closest("[data-id]");
    if (!block) {
      // Thank you @GarboMuffin for this code:
      // When right clicking on the boundaries of a block in the flyout,
      // the click event can happen on a background rectangle and not on the actual block for some reason.
      // In this case, the block group should immediately follow the rect.
      if (target.tagName === "rect" && !target.classList.contains("blocklyMainBackground")) {
        target = target.nextSibling;
        block = target && target.closest("[data-id]");
      }
    }
    if (block) {
      block = Blockly.getMainWorkspace().getBlockById(block.dataset.id);
      // Keep jumping to the parent block until we find a non-shadow block.
      while (block && block.isShadow()) {
        block = block.getParent();
      }
    }

    let allItems = [];
    scratchAddons.eventTargets.tab
      .map((eventTarget) => eventTarget._blockContextMenu)
      .filter((menuItems) => menuItems.length)
      .forEach((menuItems) => (allItems = [...allItems, ...menuItems]));

    for (const { extra, callback } of allItems) {
      const { workspace, blocks, flyout } = extra;
      let injectMenu = false;
      if (workspace && event.target.className.baseVal == "blocklyMainBackground") {
        injectMenu = true;
      }
      if (block && blocks && !event.target.closest(".blocklyFlyout")) {
        injectMenu = true;
      }
      if (block && flyout && event.target.closest(".blocklyFlyout")) {
        injectMenu = true;
      }
      if (injectMenu) items = callback(items, block);
    }

    oldShow.call(this, event, items, something);
    items.forEach((item, i) => {
      if (item.separator) {
        const itemElt = document.querySelector(".blocklyContextMenu").children[i];
        itemElt.style.paddingTop = "2px";
        itemElt.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
      }
    });
  };
}
