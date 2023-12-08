import Trap from "./Trap.js";
import ReduxHandler from "./ReduxHandler.js";
import Listenable from "../common/Listenable.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
import * as blocks from "./blocks.js";
import { addContextMenu } from "./contextmenu.js";
import * as modal from "./modal.js";

const DATA_PNG = "data:image/png;base64,";

const contextMenuCallbacks = [];
const CONTEXT_MENU_ORDER = ["editor-devtools", "block-switching", "blocks2image", "swap-local-global"];
let createdAnyBlockContextMenus = false;

/**
 * APIs specific to userscripts.
 * @extends Listenable
 * @property {Trap} traps
 * @property {ReduxHandler} redux
 */
export default class Tab extends Listenable {
  constructor(info) {
    super();
    this._addonId = info.id;
    this.traps = new Trap(this);
    this.redux = new ReduxHandler();
    this._waitForElementSet = new WeakSet();
  }
  /**
   * Version of the renderer (scratch-www, scratchr2, or null if it cannot be determined).
   * @type {?string}
   */
  get clientVersion() {
    if (location.origin !== "https://scratch.mit.edu") return "scratch-www"; // scratchr2 cannot be self-hosted
    if (!this._clientVersion)
      this._clientVersion = document.querySelector("meta[name='format-detection']")
        ? "scratch-www"
        : document.querySelector("script[type='text/javascript']")
          ? "scratchr2"
          : null;
    return this._clientVersion;
  }
  /**
   * @callback Tab~blockCallback
   * @param {object} params - the passed params.
   * @param {object} thread - the current thread.
   */
  /**
   * Adds a custom stack block definition. Internally this is a special-cased custom block.
   * @param {string} proccode the procedure definition code
   * @param {object} opts - options.
   * @param {string[]} opts.args - a list of argument names the block takes.
   * @param {Tab~blockCallback} opts.callback - the callback.
   * @param {boolean=} opts.hidden - whether the block is hidden from the palette.
   * @param {string=} opts.displayName - the display name of the block, if different from the proccode.
   */
  addBlock(proccode, opts) {
    blocks.init(this);
    return blocks.addBlock(proccode, opts);
  }
  /**
   * Removes a stack block definition. Should not be called in most cases.
   * @param {string} proccode the procedure definition code of the block
   */
  removeBlock(proccode) {
    return blocks.removeBlock(proccode);
  }
  /**
   * Sets the color for the custom blocks.
   * @param {object} colors - the colors.
   * @param {string=} colors.color - the primary color.
   * @param {string=} colors.secondaryColor - the secondary color.
   * @param {string=} colors.tertiaryColor - the tertiary color.
   */
  setCustomBlockColor(colors) {
    return blocks.setCustomBlockColor(colors);
  }
  /**
   * Gets the custom block colors.
   * @returns {object} - the colors.
   */
  getCustomBlockColor() {
    return blocks.color;
  }
  /**
   * Gets a custom block from the procedure definition code.
   * @param {string} proccode the procedure definition code.
   * @returns {object=} the custom block definition.
   */
  getCustomBlock(proccode) {
    return blocks.getCustomBlock(proccode);
  }
  /**
   * Loads a script by URL.
   * @param {string} url - script URL.
   * @returns {Promise}
   */
  loadScript(url) {
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
   * @param {string} selector - argument passed to querySelector.
   * @param {object} opts - options.
   * @param {boolean=} opts.markAsSeen - Whether it should mark resolved elements to be skipped next time or not.
   * @param {function=} opts.condition - A function that returns whether to resolve the selector or not.
   * @param {function=} opts.elementCondition - A function that returns whether to resolve the selector or not, given an element.
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
        if (opts.elementCondition && !opts.elementCondition(element)) continue;
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
      elementCondition: opts.elementCondition || null,
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
    if (location.origin === "https://scratchfoundation.github.io" || location.port === "8601") {
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

  /**
   * @private
   */
  get _eventTargetKey() {
    return "tab";
  }

  /**
   * Gets the hashed class name for a Scratch stylesheet class name.
   * @param {...*} args Unhashed class names.
   * @param {object} opts - options.
   * @param {String[]|String} opts.others - Non-Scratch class or classes to merge.
   * @returns {string} Hashed class names.
   */
  scratchClass(...args) {
    const isProject =
      location.pathname.split("/")[1] === "projects" &&
      !["embed", "remixes", "studios"].includes(location.pathname.split("/")[3]);
    const isScratchGui = location.origin === "https://scratchfoundation.github.io" || location.port === "8601";
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

  scratchClassReady() {
    // Make sure to return a resolved promise if this is not a project!
    const isProject =
      location.pathname.split("/")[1] === "projects" &&
      !["embed", "remixes", "studios"].includes(location.pathname.split("/")[3]);
    const isScratchGui = location.origin === "https://scratchfoundation.github.io" || location.port === "8601";
    if (!isProject && !isScratchGui) return Promise.resolve();

    this._calledScratchClassReady = true;
    if (scratchAddons.classNames.loaded) return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener("scratchAddonsClassNamesReady", resolve, { once: true });
    });
  }

  /**
   * Hides an element when the addon is disabled.
   * @param {HTMLElement} el - the element.
   * @param {object=} opts - the options.
   * @param {string=} opts.display - the fallback value for CSS display.
   */
  displayNoneWhileDisabled(el, { display = "" } = {}) {
    el.style.display = `var(--${this._addonId.replace(/-([a-z])/g, (g) =>
      g[1].toUpperCase()
    )}-_displayNoneWhileDisabledValue${display ? ", " : ""}${display})`;
  }

  /**
   * The direction of the text; i.e. rtl or ltr.
   * @type {string}
   */
  get direction() {
    // https://github.com/scratchfoundation/scratch-l10n/blob/master/src/supported-locales.js
    const rtlLocales = ["ar", "ckb", "fa", "he"];
    const lang = scratchAddons.globalState.auth.scratchLang.split("-")[0];
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
   * @param {object} opts - options.
   * @param {string} opts.space - the shared space name.
   * @param {HTMLElement} element - the element to add.
   * @param {number} order - the order of the added element. Should not conflict with other addons.
   * @param {HTMLElement=} scope - if multiple shared spaces exist, the one where the shared space gets added to.
   * @returns {boolean} whether the operation was successful or not.
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
   * @property {boolean} enabled - whether it is enabled.
   * @property {string} text - the context menu item label.
   * @property {function} callback - the function that is called when item is clicked.
   * @property {boolean} separator - whether to add a separator above the item.
   */

  /**
   * Callback to modify the context menu.
   * @callback Tab~blockContextMenuCallback
   * @param {Tab~ContextMenuItem[]} items - the items added by vanilla code or other addons.
   * @param {?object} block - the targeted block, if any.
   * @returns {Tab~ContextMenuItem[]} the array that contains values of items array as well as new items.
   */

  /**
   * Creates an item in the editor Blockly context menu.
   * @param {Tab~blockContextMenuCallback} callback Returns new menu items.
   * @param {object} conditions - Show context menu when one of these conditions meet.
   * @param {boolean=} conditions.workspace - Add to workspace context menu.
   * @param {boolean=} conditions.blocks - Add to block context menu outside the flyout.
   * @param {boolean=} conditions.flyout - Add to block context menu in flyout/palette.
   * @param {boolean=} conditions.comments - Add to comments.
   */
  createBlockContextMenu(callback, { workspace = false, blocks = false, flyout = false, comments = false } = {}) {
    contextMenuCallbacks.push({ addonId: this._addonId, callback, workspace, blocks, flyout, comments });

    // Sort to ensure userscript run order doesn't change callback order
    contextMenuCallbacks.sort((b, a) => CONTEXT_MENU_ORDER.indexOf(b.addonId) - CONTEXT_MENU_ORDER.indexOf(a.addonId));

    if (createdAnyBlockContextMenus) return;
    createdAnyBlockContextMenus = true;

    this.traps.getBlockly().then((ScratchBlocks) => {
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
   * @property {string} type - the type of the context menu.
   * @property {HTMLElement} menuItem - the item element.
   * @property {HTMLElement} target - the target item.
   * @property {number=} index - the index, if applicable.
   */

  /**
   * Callback executed when the item is clicked.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context - the context for the action.
   */

  /**
   * Callback to check if the item should be visible.
   * @callback Tab~EditorContextMenuItemCallback
   * @param {Tab~EditorContextMenuContext} context - the context for the action.
   * @returns {boolean} true to make it visible, false to hide
   */

  /**
   * Adds a context menu item for the editor.
   * @param {Tab~EditorContextMenuItemCallback} callback - the callback executed when the item is clicked.
   * @param {object} opts - the options.
   * @param {string} opts.className - the class name to add to the item.
   * @param {string[]} opts.types - which types of context menu it should add to.
   * @param {string} opts.position - the position inside the context menu.
   * @param {number} opts.order - the order within the position.
   * @param {string} opts.label - the label for the item.
   * @param {boolean=} opts.border - whether to add a border at the top or not.
   * @param {boolean=} opts.dangerous - whether to indicate the item as dangerous or not.
   * @param {Tab~EditorContextMenuItemCondition} opts.condition - a function to check if the item should be shown.
   */
  createEditorContextMenu(...args) {
    addContextMenu(this, ...args);
  }

  /**
   * @typedef {object} Tab~Modal
   * @property {HTMLElement} container - the container element.
   * @property {HTMLElement} content - where the content should be appended.
   * @property {HTMLElement} backdrop - the modal overlay.
   * @property {HTMLElement} closeButton - the close (X) button on the header.
   * @property {function} open - opens the modal.
   * @property {function} close - closes the modal.
   * @property {function} remove - removes the modal, making it no longer usable.
   */

  /**
   * Creates a modal using the vanilla style.
   * @param {string} title - the title.
   * @param {object=} opts - the options.
   * @param {boolean=} opts.isOpen - whether to open the modal by default.
   * @param {boolean=} opts.useEditorClasses - if on editor, whether to apply editor styles and not www styles.
   * @param {boolean=} opts.useSizesClass - if on scratch-www, whether to add modal-sizes class.
   * @return {Tab~Modal} - the modal.
   */
  createModal(title, { isOpen = false, useEditorClasses = false, useSizesClass = false } = {}) {
    if (this.editorMode !== null && useEditorClasses) return modal.createEditorModal(this, title, { isOpen });
    if (this.clientVersion === "scratch-www") return modal.createScratchWwwModal(title, { isOpen, useSizesClass });
    return modal.createScratchr2Modal(title, { isOpen });
  }

  /**
   * Opens a confirmation dialog. Can be used to replace confirm(), but is async.
   * @param {string} title - the title.
   * @param {string} message - the message displayed in the contents.
   * @param {object=} opts - the options.
   * @param {boolean=} opts.useEditorClasses - if on editor, whether to apply editor styles and not www styles.
   * @param {string=} opts.okButtonLabel - the label of the button for approving the confirmation
   * @param {string=} opts.cancelButtonLabel - the label of the button for rejecting the confirmation
   * @returns {Promise<boolean>} - whether the confirmation was approved
   */
  confirm(title, message, opts) {
    return modal.confirm(this, title, message, opts);
  }

  /**
   * Opens a prompt that a user can enter a value into.
   * @param {string} title - the title.
   * @param {string} message - the message displayed in the contents.
   * @param {string=} defaultValue - the default value.
   * @param {object=} opts - the options.
   * @param {boolean=} opts.useEditorClasses - if on editor, whether to apply editor styles and not www styles.
   * @returns Promise<?string> - the entered value, or null if canceled.
   */
  prompt(title, message, defaultValue, opts) {
    return modal.prompt(this, title, message, defaultValue, opts);
  }
}
