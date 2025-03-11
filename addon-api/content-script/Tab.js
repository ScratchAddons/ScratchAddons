import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import Listenable from "../common/Listenable.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
import * as blocks from "./blocks.js";
import { addContextMenu } from "./contextmenu.js";
import * as modal from "./modal.js";

const DATA_PNG = "data:image/png;base64,";

const isScratchGui =
  location.origin === "https://scratchfoundation.github.io" || ["8601", "8602"].includes(location.port);

const contextMenuCallbacks = [];
const CONTEXT_MENU_ORDER = ["editor-devtools", "block-switching", "blocks2image", "swap-local-global"];
let createdAnyBlockContextMenus = false;

/**
 * APIs specific to userscripts.
 */
export default class Tab extends Listenable {
  constructor(addonObj, info) {
    super();
    /** @private */
    this._addonId = info.id;
    /**
     * Obtain objects that aren't otherwise available.
     */
    this.traps = new Trap(this);
    /**
     * Get and modify Scratch's redux state.
     */
    this.redux = new ReduxHandler();
    /** @private */
    this._waitForElementSet = new WeakSet();
    /** @private */
    this._addonObj = addonObj;
  }
  /**
   * Version of the renderer (scratch-www, scratchr2, or null if it cannot be determined).
   * @type {?string}
   */
  get clientVersion() {
    if (location.origin !== "https://scratch.mit.edu") return "scratch-www"; // scratchr2 cannot be self-hosted
    if (!this._clientVersion)
      /** @private */
      this._clientVersion = document.querySelector("meta[name='format-detection']")
        ? "scratch-www"
        : document.querySelector("script[type='text/javascript']")
          ? "scratchr2"
          : null;
    return this._clientVersion;
  }
  /**
   * @callback Tab~blockCallback
   * @param {object} params The passed params.
   * @param {object} thread The current thread.
   */
  /**
   * Adds a custom stack block definition. Internally this is a special-cased custom block.
   * @param {string} proccode The procedure definition code.
   * @param {object} opts Options.
   * @param {string[]} opts.args A list of argument names the block takes.
   * @param {Tab~blockCallback} opts.callback The callback.
   * @param {boolean=} opts.hidden Whether the block is hidden from the palette.
   * @param {string=} opts.displayName The display name of the block, if different from the proccode.
   */
  addBlock(proccode, opts) {
    blocks.init(this);
    return blocks.addBlock(proccode, opts);
  }
  /**
   * Removes a stack block definition. Should not be called in most cases.
   * @param {string} proccode The procedure definition code of the block.
   */
  removeBlock(proccode) {
    return blocks.removeBlock(proccode);
  }
  /**
   * Sets the color for the custom blocks.
   * @param {object} colors The colors.
   * @param {string=} colors.color The primary color.
   * @param {string=} colors.secondaryColor The secondary color.
   * @param {string=} colors.tertiaryColor The tertiary color.
   */
  setCustomBlockColor(colors) {
    return blocks.setCustomBlockColor(colors);
  }
  /**
   * Gets the custom block colors.
   * @returns {object} The colors.
   */
  getCustomBlockColor() {
    return blocks.color;
  }
  /**
   * Gets a custom block from the procedure definition code.
   * @param {string} proccode The procedure definition code.
   * @returns {object=} The custom block definition.
   */
  getCustomBlock(proccode) {
    return blocks.getCustomBlock(proccode);
  }
  /**
   * Loads a script by URL.
   * @param {string} url Script URL.
   * @returns {Promise}
   */
  loadScript(relativeUrl) {
    const urlObj = new URL(import.meta.url);
    urlObj.pathname = relativeUrl;

    const url = urlObj.href;

    return new Promise((resolve, reject) => {
      if (scratchAddons.loadedScripts[url]) {
        const obj = scratchAddons.loadedScripts[url];
        if (obj.loaded) {
          // Script has been already loaded
          resolve();
        } else if (obj.error === null) {
          // Script has been appended to document.head, but not loaded yet.
          obj.script.addEventListener("load", (e) => {
            // Script loaded successfully - resolve the promise, but don't edit the global object (since it's already been edited by the original listener).
            resolve();
          });
          obj.script.addEventListener("error", ({ error }) => {
            // Script failed to load - reject the promise, but don't edit the global object (since it's already been edited by the original listener).
            reject(`Failed to load script from ${url} - ${error}`);
          });
        } else {
          // Script has been appended to document.head, and failed to load.
          reject(`Failed to load script from ${url} - ${obj.error}`);
        }
      } else {
        // No other addon has loaded this script yet.
        const script = document.createElement("script");
        script.src = url;
        const obj = (scratchAddons.loadedScripts[url] = {
          script,
          loaded: false,
          error: null,
        });
        document.head.appendChild(script);
        script.addEventListener("load", () => {
          obj.loaded = true;
          resolve();
        });
        script.addEventListener("error", ({ error }) => {
          obj.error = error;
          reject(`Failed to load script from ${url} - ${error}`);
        });
      }
    });
  }
  /**
   * Waits until an element renders, then return the element.
   * @param {string} selector Argument passed to querySelector.
   * @param {object} opts Options.
   * @param {boolean=} opts.markAsSeen Whether it should mark resolved elements to be skipped next time or not.
   * @param {function=} opts.condition A function that returns whether to resolve the selector or not.
   * @param {function=} opts.elementCondition A function that returns whether to resolve the selector or not, given an element.
   * @param {function=} opts.reduxCondition A function that returns whether to resolve the selector or not.
   * Use this as an optimization and do not rely on the behavior.
   * @param {string[]=} opts.reduxEvents An array of redux events that must be dispatched before resolving the selector.
   * Use this as an optimization and do not rely on the behavior.
   * @param {boolean=} opts.resizeEvent Whether the selector should be resolved on window resize, in addition to the reduxEvents.
   * @returns {Promise<Element>} The element found.
   */
  waitForElement(selector, opts = {}) {
    const markAsSeen = !!opts.markAsSeen;
    if (!opts.condition || opts.condition()) {
      const firstQuery = document.querySelectorAll(selector);
      for (const element of firstQuery) {
        if (this._waitForElementSet.has(element)) continue;
        if (opts.elementCondition && !opts.elementCondition(element)) continue;
        if (markAsSeen) this._waitForElementSet.add(element);
        return Promise.resolve(element);
      }
    }
    const { reduxCondition, condition } = opts;
    let reduxListener;
    let resizeListener;
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
    if (opts.reduxEvents || opts.resizeEvent) {
      const oldCondition = combinedCondition;
      let satisfied = false;
      combinedCondition = () => {
        if (oldCondition && !oldCondition()) return false;
        return satisfied;
      };
      reduxListener = ({ detail }) => {
        if (opts.reduxEvents && opts.reduxEvents.includes(detail.action.type)) {
          satisfied = true;
        }
      };
      this.redux.initialize();
      this.redux.addEventListener("statechanged", reduxListener);
      resizeListener = () => {
        if (opts.resizeEvent) satisfied = true;
      };
      window.addEventListener("resize", resizeListener);
    }
    const promise = scratchAddons.sharedObserver.watch({
      query: selector,
      seen: markAsSeen ? this._waitForElementSet : null,
      condition: combinedCondition,
      elementCondition: opts.elementCondition || null,
    });
    if (reduxListener || resizeListener) {
      promise.then((match) => {
        this.redux.removeEventListener("statechanged", reduxListener);
        window.removeEventListener("resize", resizeListener);
        return match;
      });
    }
    return promise;
  }
  /**
   * Editor mode (or null for non-editors).
   * @type {?string}
   */
  get editorMode() {
    if (isScratchGui || location.pathname === "/projects/editor" || location.pathname === "/projects/editor/") {
      // Note that scratch-gui does not change the URL when going fullscreen.
      if (this.redux.state?.scratchGui?.mode?.isFullScreen) return "fullscreen";
      return "editor";
    }
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
   * @param {string} dataURL Data url of the PNG image.
   * @returns {Promise}
   */
  copyImage(dataURL) {
    if (!dataURL.startsWith(DATA_PNG)) return Promise.reject(new TypeError("Expected PNG data URL"));
    if (typeof Clipboard.prototype.write === "function") {
      // Chrome or Firefox 127+
      const blob = dataURLToBlob(dataURL);
      const items = [
        new ClipboardItem({
          "image/png": blob,
        }),
      ];
      return navigator.clipboard.write(items);
    } else {
      // Firefox 109-126 only
      // The image is sent to the background event page where it is copied with extension APIs
      return scratchAddons.methods.copyImage(dataURL).catch((err) => {
        return Promise.reject(new Error(`Error inside clipboard handler: ${err}`));
      });
    }
  }

  /**
   * Gets translation used by Scratch.
   * @param {string} key Translation key.
   * @returns {string} Translation.
   */
  scratchMessage(key) {
    if (this.clientVersion === "scratch-www") {
      if (this.editorMode && this.redux.state) {
        if (this.redux.state.locales.messages[key]) {
          return this.redux.state.locales.messages[key];
        }
      }
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

  /** @private */
  get _eventTargetKey() {
    return "tab";
  }

  /**
   * Gets the hashed class name for a Scratch stylesheet class name.
   * @param {...*} args Unhashed class names.
   * @param {object} opts Options.
   * @param {String[]|String} opts.others Non-Scratch class or classes to merge.
   * @returns {string} Hashed class names.
   */
  scratchClass(...args) {
    const isProject =
      location.pathname.split("/")[1] === "projects" &&
      !["embed", "remixes", "studios"].includes(location.pathname.split("/")[3]);
    if (!isProject && !isScratchGui) {
      scratchAddons.console.warn("addon.tab.scratchClass() was used outside a project page");
      return "";
    }

    if (!this._calledScratchClassReady)
      throw new Error("Wait until addon.tab.scratchClassReady() resolves before using addon.tab.scratchClass");

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
          throw new Error("addon.tab.scratchClass call failed. Class names are not ready yet");
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

  /** @private */
  scratchClassReady() {
    // Make sure to return a resolved promise if this is not a project!
    const isProject =
      location.pathname.split("/")[1] === "projects" &&
      !["embed", "remixes", "studios"].includes(location.pathname.split("/")[3]);
    if (!isProject && !isScratchGui) return Promise.resolve();

    /** @private */
    this._calledScratchClassReady = true;
    if (scratchAddons.classNames.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener("scratchAddonsClassNamesReady", resolve, { once: true });
    });
  }

  /**
   * Hides an element when the addon is disabled.
   * @param {HTMLElement} el The element.
   */
  displayNoneWhileDisabled(el) {
    el.dataset.saHideDisabled = this._addonId;
  }

  /**
   * The direction of the text.
   * @type {"rtl" | "ltr"}
   */
  get direction() {
    // https://github.com/scratchfoundation/scratch-l10n/blob/master/src/supported-locales.js
    const rtlLocales = ["ar", "ckb", "fa", "he"];
    const rawLang = this._addonObj.auth.scratchLang; // Guaranteed to exist
    const lang = rawLang.split("-")[0];
    return rtlLocales.includes(lang) ? "rtl" : "ltr";
  }

  /**
   * Adds an item to a shared space.
   * Defined shared spaces are:
   * stageHeader - the stage header
   * fullscreenStageHeader - the stage header for fullscreen
   * afterGreenFlag - after the green flag
   * afterStopButton - after the stop button
   * afterCopyLinkButton - after the copy link button, shown below project descriptions
   * afterSoundTab - after the sound tab in editor
   * forumsBeforePostReport - before the report button in forum posts
   * forumsAfterPostReport - after the report button in forum posts
   * beforeRemixButton - before the remix button in project page
   * studioCuratorsTab - inside the studio curators tab
   * forumToolbarTextDecoration - after the forum toolbar's text decoration (bold, etc) buttons
   * forumToolbarLinkDecoration - after the forum toolbar's link buttons
   * forumToolbarFont - after the forum toolbar's big or small font dropdown
   * forumToolbarList - after the forum toolbar's list buttons
   * forumToolbarDecoration - after the forum toolbar's emoji and quote buttons
   * forumToolbarEnvironment - after the forum toolbar's environment button
   * forumToolbarScratchblocks - after the forum toolbar's scratchblocks dropdown
   * forumToolbarTools - after the forum toolbar's remove formatting and preview buttons
   * assetContextMenuAfterExport - after the export button of asset (sprite, costume, etc)'s context menu
   * assetContextMenuAfterDelete - after the delete button of asset (sprite, costume, etc)'s context menu
   * monitor - after the end of the stage monitor context menu
   * paintEditorZoomControls - before the zoom controls in the paint editor
   *
   *
   * @param {object} opts Options.
   * @param {"stageHeader" | "fullscreenStageHeader" | "afterGreenFlag" | "afterStopButton" | "afterCopyLinkButton" | "afterSoundTab" | "forumsBeforePostReport" | "forumsAfterPostReport" | "beforeRemixButton" | "studioCuratorsTab" | "forumToolbarTextDecoration" | "forumToolbarLinkDecoration" | "forumToolbarFont" | "forumToolbarList" | "forumToolbarDecoration" | "forumToolbarEnvironment" | "forumToolbarScratchblocks" | "forumToolbarTools" | "assetContextMenuAfterExport" | "assetContextMenuAfterDelete" | "monitor" | "paintEditorZoomControls"} opts.space The shared space name.
   * @param {HTMLElement} opts.element The element to add.
   * @param {number} opts.order The order of the added element. Should not conflict with other addons.
   * @param {HTMLElement=} opts.scope If multiple shared spaces exist, the one where the shared space gets added to.
   * @returns {boolean} Whether the operation was successful or not.
   */
  appendToSharedSpace({ space, element, order, scope }) {
    const q = document.querySelector.bind(document);
    const sharedSpaces = {
      stageHeader: {
        // Non-fullscreen stage header only
        element: () => q("[class^='stage-header_stage-size-row']"),
        from: () => [],
        until: () => [
          // Small/big stage buttons (for editor mode)
          q("[class^='stage-header_stage-size-toggle-group']"),
          // Full screen icon (for player mode)
          q("[class^='stage-header_stage-size-row']").lastChild,
        ],
      },
      fullscreenStageHeader: {
        // Fullscreen stage header only
        element: () => q("[class^='stage-header_stage-menu-wrapper']"),
        from: function () {
          let emptyDiv = this.element().querySelector(".sa-spacer");
          if (!emptyDiv) {
            emptyDiv = document.createElement("div");
            emptyDiv.style.marginLeft = "auto";
            emptyDiv.className = "sa-spacer";
            this.element().insertBefore(emptyDiv, this.element().lastChild);
          }
          return [emptyDiv];
        },
        until: () => [q("[class^='stage-header_stage-menu-wrapper']").lastChild],
      },
      afterGreenFlag: {
        element: () => q("[class^='controls_controls-container']"),
        from: () => [],
        until: () => [q("[class^='stop-all_stop-all']")],
      },
      afterStopButton: {
        element: () => q("[class^='controls_controls-container']"),
        from: () => [q("[class^='stop-all_stop-all']")],
        until: () => [],
      },
      beforeProjectActionButtons: {
        element: () => q(".flex-row.subactions > .flex-row.action-buttons"),
        from: () => [],
        until: () => [q(".report-button"), q(".action-buttons > div")],
      },
      afterCopyLinkButton: {
        element: () => q(".flex-row.subactions > .flex-row.action-buttons"),
        from: () => [q(".copy-link-button")],
        until: () => [],
      },
      afterSoundTab: {
        element: () => q("[class^='react-tabs_react-tabs__tab-list']"),
        from: () => [q("[class^='react-tabs_react-tabs__tab-list']").children[2]],
        // Element used in find-bar addon
        until: () => [q(".sa-find-bar")],
      },
      forumsBeforePostReport: {
        element: () => scope.querySelector(".postfootright > ul"),
        from: () => [],
        until: function () {
          let reportButton = scope.querySelector(
            ".postfootright > ul > li.postreport, .postfootright > ul > li.pseudopostreport"
          );
          if (!reportButton) {
            // User is logged out, so there's no report button on the post footer
            // Create a pseudo post report button as a separator between this space
            // and the forumsAfterPostReport space.
            reportButton = Object.assign(document.createElement("li"), {
              className: "pseudopostreport",
              textContent: " 🞄 ",
            });
            this.element().appendChild(reportButton);
          }
          return [reportButton];
        },
      },
      forumsAfterPostReport: {
        element: () => scope.querySelector(".postfootright > ul"),
        from: function () {
          let reportButton = scope.querySelector(
            ".postfootright > ul > li.postreport, .postfootright > ul > li.pseudopostreport"
          );
          if (!reportButton) {
            // User is logged out. See comment on forumsBeforePostReport space
            reportButton = Object.assign(document.createElement("li"), {
              className: "pseudopostreport",
              textContent: " 🞄 ",
            });
            this.element().appendChild(reportButton);
          }
          return [reportButton];
        },
        until: () => [scope.querySelector(".postfootright > ul > li.postquote")],
      },
      beforeRemixButton: {
        element: () => q(".project-buttons"),
        from: () => [],
        until: () => [
          q(".project-buttons > .remix-button:not(.sa-remix-button)"),
          q(".project-buttons > .see-inside-button"),
        ],
      },
      studioCuratorsTab: {
        element: () => q(".studio-tabs div:nth-child(2)"),
        from: () => [],
        // .commenting-status only exists if account is muted
        until: () => [
          q(".studio-tabs div:nth-child(2) > .commenting-status"),
          q(".studio-tabs div:nth-child(2) > .studio-members"),
        ],
      },
      forumToolbarTextDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton4")],
        until: () => [q(".markItUpButton4 ~ .markItUpSeparator")],
      },
      forumToolbarLinkDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton6")],
        until: () => [q(".markItUpButton6 ~ .markItUpSeparator")],
      },
      forumToolbarFont: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton7")],
        until: () => [q(".markItUpButton7 ~ .markItUpSeparator")],
      },
      forumToolbarList: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton10")],
        until: () => [q(".markItUpButton10 ~ .markItUpSeparator")],
      },
      forumToolbarDecoration: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton12")],
        until: () => [q(".markItUpButton12 ~ .markItUpSeparator")],
      },
      forumToolbarEnvironment: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton13")],
        until: () => [q(".markItUpButton13 ~ .markItUpSeparator")],
      },
      forumToolbarScratchblocks: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton14")],
        until: () => [q(".markItUpButton14 ~ .markItUpSeparator")],
      },
      forumToolbarTools: {
        element: () => q(".markItUpHeader > ul"),
        from: () => [q(".markItUpButton16")],
        until: () => [],
      },
      assetContextMenuAfterExport: {
        element: () => scope,
        from: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuExport")
          );
        },
        until: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuDelete")
          );
        },
      },
      assetContextMenuAfterDelete: {
        element: () => scope,
        from: () => {
          return Array.prototype.filter.call(
            scope.children,
            (c) => c.textContent === this.scratchMessage("gui.spriteSelectorItem.contextMenuDelete")
          );
        },
        until: () => [],
      },
      monitor: {
        element: () => scope,
        from: () => {
          const endOfVanilla = [
            this.scratchMessage("gui.monitor.contextMenu.large"),
            this.scratchMessage("gui.monitor.contextMenu.slider"),
            this.scratchMessage("gui.monitor.contextMenu.sliderRange"),
            this.scratchMessage("gui.monitor.contextMenu.export"),
          ];
          const potential = Array.prototype.filter.call(scope.children, (c) => endOfVanilla.includes(c.textContent));
          return [potential[potential.length - 1]];
        },
        until: () => [],
      },
      paintEditorZoomControls: {
        element: () => {
          return (
            q(".sa-paintEditorZoomControls-wrapper") ||
            (() => {
              const wrapper = Object.assign(document.createElement("div"), {
                className: "sa-paintEditorZoomControls-wrapper",
              });

              wrapper.style.display = "flex";
              wrapper.style.flexDirection = "row-reverse";
              wrapper.style.height = "calc(1.95rem + 2px)";

              const zoomControls = q("[class^='paint-editor_zoom-controls']");

              zoomControls.replaceWith(wrapper);
              wrapper.appendChild(zoomControls);

              return wrapper;
            })()
          );
        },
        from: () => [],
        until: () => [],
      },
      afterProfileCountry: {
        element: () =>
          q(".shared-after-country-space") ||
          (() => {
            const wrapper = Object.assign(document.createElement("div"), {
              className: "shared-after-country-space",
            });

            wrapper.style.display = "inline-block";

            document.querySelector(".location").appendChild(wrapper);

            return wrapper;
          })(),
        from: () => [],
        until: () => [],
      },
    };

    const spaceInfo = sharedSpaces[space];
    const spaceElement = spaceInfo.element();
    if (!spaceElement) return false;
    const from = spaceInfo.from();
    const until = spaceInfo.until();

    element.dataset.saSharedSpaceOrder = order;

    let foundFrom = false;
    if (from.length === 0) foundFrom = true;

    // insertAfter = element whose nextSibling will be the new element
    // -1 means append at beginning of space (prepend)
    // This will stay null if we need to append at the end of space
    let insertAfter = null;

    const children = Array.from(spaceElement.children);
    for (let indexString of children.keys()) {
      const child = children[indexString];
      const i = Number(indexString);

      // Find either element from "from" before doing anything
      if (!foundFrom) {
        if (from.includes(child)) {
          foundFrom = true;
          // If this is the last child, insertAfter will stay null
          // and the element will be appended at the end of space
        }
        continue;
      }

      if (until.includes(child)) {
        // This is the first SA element appended to this space
        // If from = [] then prepend, otherwise append after
        // previous child (likely a "from" element)
        if (i === 0) insertAfter = -1;
        else insertAfter = children[i - 1];
        break;
      }

      if (child.dataset.saSharedSpaceOrder) {
        if (Number(child.dataset.saSharedSpaceOrder) > order) {
          // We found another SA element with higher order number
          // If from = [] and this is the first child, prepend.
          // Otherwise, append before this child.
          if (i === 0) insertAfter = -1;
          else insertAfter = children[i - 1];
          break;
        }
      }
    }

    if (!foundFrom) return false;
    // It doesn't matter if we didn't find an "until"

    // Separators in forum post spaces
    if (space === "forumsBeforePostReport") {
      element.appendChild(document.createTextNode(" | "));
    } else if (space === "forumsAfterPostReport") {
      element.prepend(document.createTextNode("| "));
    }

    if (insertAfter === null) {
      // This might happen with until = []
      spaceElement.appendChild(element);
    } else if (insertAfter === -1) {
      // This might happen with from = []
      spaceElement.prepend(element);
    } else {
      // Works like insertAfter but using insertBefore API.
      // nextSibling cannot be null because insertAfter
      // is always set to children[i-1], so it must exist
      spaceElement.insertBefore(element, insertAfter.nextSibling);
    }
    return true;
  }

  /**
   * Type for context menu item.
   * @typedef {object} Tab~ContextMenuItem
   * @property {boolean} enabled Whether it is enabled.
   * @property {string} text The context menu item label.
   * @property {function} callback The function that is called when item is clicked.
   * @property {boolean} separator Whether to add a separator above the item.
   */

  /**
   * Callback to modify the context menu.
   * @callback Tab~blockContextMenuCallback
   * @param {Tab~ContextMenuItem[]} items The items added by vanilla code or other addons.
   * @param {?object} block The targeted block, if any.
   * @returns {Tab~ContextMenuItem[]} The array that contains values of items array as well as new items.
   */

  /**
   * Creates an item in the editor Blockly context menu.
   * @param {Tab~blockContextMenuCallback} callback Returns new menu items.
   * @param {object} conditions Show context menu when one of these conditions meet.
   * @param {boolean=} conditions.workspace Add to workspace context menu.
   * @param {boolean=} conditions.blocks Add to block context menu outside the flyout.
   * @param {boolean=} conditions.flyout Add to block context menu in flyout/palette.
   * @param {boolean=} conditions.comments Add to comments.
   */
  createBlockContextMenu(callback, { workspace = false, blocks = false, flyout = false, comments = false } = {}) {
    contextMenuCallbacks.push({ addonId: this._addonId, callback, workspace, blocks, flyout, comments });

    // Sort to ensure userscript run order doesn't change callback order
    contextMenuCallbacks.sort((b, a) => CONTEXT_MENU_ORDER.indexOf(b.addonId) - CONTEXT_MENU_ORDER.indexOf(a.addonId));

    if (createdAnyBlockContextMenus) return;
    createdAnyBlockContextMenus = true;

    this.traps.getBlockly().then((ScratchBlocks) => {
      if (ScratchBlocks.registry) {
        // new Blockly
        const oldGenerateContextMenu = ScratchBlocks.BlockSvg.prototype.generateContextMenu;
        ScratchBlocks.BlockSvg.prototype.generateContextMenu = function (...args) {
          let items = oldGenerateContextMenu.call(this, ...args);
          for (const { callback, blocks, flyout } of contextMenuCallbacks) {
            let injectMenu =
              // Block in workspace
              (blocks && !this.isInFlyout) ||
              // Block in flyout
              (flyout && this.isInFlyout);
            if (injectMenu) {
              try {
                items = callback(items, this);
              } catch (e) {
                console.error("Error while calling context menu callback: ", e);
              }
            }
          }
          return items;
        };
        return;
      }

      const oldShow = ScratchBlocks.ContextMenu.show;
      ScratchBlocks.ContextMenu.show = function (event, items, rtl) {
        const gesture = ScratchBlocks.mainWorkspace.currentGesture_;
        const block = gesture.targetBlock_;

        for (const { callback, workspace, blocks, flyout, comments } of contextMenuCallbacks) {
          let injectMenu =
            // Workspace
            (workspace && !block && !gesture.flyout_ && !gesture.startBubble_) ||
            // Block in workspace
            (blocks && block && !gesture.flyout_) ||
            // Block in flyout
            (flyout && gesture.flyout_) ||
            // Comments
            (comments && gesture.startBubble_);
          if (injectMenu) {
            try {
              items = callback(items, block);
            } catch (e) {
              console.error("Error while calling context menu callback: ", e);
            }
          }
        }

        oldShow.call(this, event, items, rtl);

        const blocklyContextMenu = ScratchBlocks.WidgetDiv.DIV.firstChild;
        items.forEach((item, i) => {
          if (i !== 0 && item.separator) {
            const itemElt = blocklyContextMenu.children[i];
            itemElt.style.paddingTop = "2px";
            itemElt.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
          }
        });
      };
    });
  }

  /**
   * @typedef {object} Tab~EditorContextMenuContext
   * @property {string} type The type of the context menu.
   * @property {HTMLElement} menuItem The item element.
   * @property {HTMLElement} target The target item.
   * @property {number=} index The index, if applicable.
   */

  /**
   * Callback executed when the item is clicked.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context The context for the action.
   */

  /**
   * Callback to check if the item should be visible.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context The context for the action.
   * @returns {boolean} True to make it visible, false to hide.
   */

  /**
   * Adds a context menu item for the editor.
   * @param {Tab~EditorContextMenuItemCallback} callback The callback executed when the item is clicked.
   * @param {object} opts The options.
   * @param {string} opts.className The class name to add to the item.
   * @param {string[]} opts.types Which types of context menu it should add to.
   * @param {string} opts.position The position inside the context menu.
   * @param {number} opts.order The order within the position.
   * @param {string} opts.label The label for the item.
   * @param {boolean=} opts.border Whether to add a border at the top or not.
   * @param {boolean=} opts.dangerous Whether to indicate the item as dangerous or not.
   * @param {Tab~EditorContextMenuItemCondition} opts.condition A function to check if the item should be shown.
   */
  createEditorContextMenu(...args) {
    addContextMenu(this, ...args);
  }

  /**
   * @typedef {object} Tab~Modal
   * @property {HTMLElement} container The container element.
   * @property {HTMLElement} content Where the content should be appended.
   * @property {HTMLElement} backdrop The modal overlay.
   * @property {HTMLElement} closeButton The close (X) button on the header.
   * @property {function} open Opens the modal.
   * @property {function} close Closes the modal.
   * @property {function} remove Removes the modal, making it no longer usable.
   */

  /**
   * Creates a modal using the vanilla style.
   * @param {string} title The title.
   * @param {object=} opts The options.
   * @param {boolean=} opts.isOpen Whether to open the modal by default.
   * @param {boolean=} opts.useEditorClasses If on editor, whether to apply editor styles and not www styles.
   * @param {boolean=} opts.useSizesClass If on scratch-www, whether to add modal-sizes class.
   * @return {Tab~Modal} The modal.
   */
  createModal(title, { isOpen = false, useEditorClasses = false, useSizesClass = false } = {}) {
    if (this.editorMode !== null && useEditorClasses) return modal.createEditorModal(this, title, { isOpen });
    if (this.clientVersion === "scratch-www") return modal.createScratchWwwModal(title, { isOpen, useSizesClass });
    return modal.createScratchr2Modal(title, { isOpen });
  }

  /**
   * Opens a confirmation dialog. Can be used to replace confirm(), but is async.
   * @param {string} title The title.
   * @param {string} message The message displayed in the contents.
   * @param {object=} opts The options.
   * @param {boolean=} opts.useEditorClasses If on editor, whether to apply editor styles and not www styles.
   * @param {string=} opts.okButtonLabel The label of the button for approving the confirmation.
   * @param {string=} opts.cancelButtonLabel The label of the button for rejecting the confirmation.
   * @returns {Promise<boolean>} Whether the confirmation was approved.
   */
  confirm(title, message, opts) {
    return modal.confirm(this, title, message, opts);
  }

  /**
   * Opens a prompt that a user can enter a value into.
   * @param {string} title The title.
   * @param {string} message The message displayed in the contents.
   * @param {string=} defaultValue The default value.
   * @param {object=} opts The options.
   * @param {boolean=} opts.useEditorClasses If on editor, whether to apply editor styles and not www styles.
   * @returns Promise<?string> The entered value, or null if canceled.
   */
  prompt(title, message, defaultValue, opts) {
    return modal.prompt(this, title, message, defaultValue, opts);
  }
}
