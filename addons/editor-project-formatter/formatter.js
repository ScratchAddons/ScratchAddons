import FormatterUtils from "./utils/formatter-utils.js";
import AddonAssets from "./utils/addon-assets.js";
import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

function closeMenu(menu, reduxHandler) {
  reduxHandler.dispatch({
    type: "scratch-gui/menus/CLOSE_MENU",
    menu: menu,
  });
}

/**Checks if the block belongs to the "Debugger" category. */
function isDebuggerBlock(block) {
  const DEBUGGER_BLOCKS = [
    "\u200B\u200Bbreakpoint\u200B\u200B",
    "\u200B\u200Blog\u200B\u200B %s",
    "\u200B\u200Bwarn\u200B\u200B %s",
    "\u200B\u200Berror\u200B\u200B %s",
  ];

  try {
    const proccode = block.getProcCode();

    return DEBUGGER_BLOCKS.includes(proccode);
  } catch {
    return false;
  }
}

function getBlockType(block) {
  if (block.type.startsWith("procedures")) return "proccedure";
  switch (block.getCategory()) {
    case "data":
      return "variable";
    case "data-lists":
      return "list";
    default:
      return "block";
  }
}

/**Class to manage the entire formatter. */
export default class EditorFormatter {
  constructor(addon, console, msg, m) {
    this.addon = addon;
    this.msg = msg;
    this.console = console;
    this.m = m;
    this.redux = this.addon.tab.redux;

    this.addonAssets = new AddonAssets(this.addon.self.dir);

    this.formatterOptsImg = this.addonAssets.getFileFromAssets("sparkle.svg");

    this.vm = this.addon.tab.traps.vm;
    this.runtime = this.vm.runtime;
    this.mainWorkspace = this.addon.tab.traps.getBlockly().then((SB) => {
      return SB.getMainWorkspace();
    });

    this.formatterUtils = new FormatterUtils(this.vm, this.addon, this.console);
    this.formatConfirm = false;
  }

  createFormatIssuesModal(issues, scope) {
    const modal = this.addon.tab.createModal(
      scope === "stage" ? this.m("format-issues") : this.m("format-issues-in-sprite"),
      {
        useEditorClasses: true,
        isOpen: true,
      }
    ); // Create a new modal

    const modalContainer = document.createElement("div");
    modalContainer.setAttribute("class", "sa-format-issues-modal-container");

    // Create Labels
    const labelA = document.createElement("span");
    labelA.className = "sa-format-issues-modal-label";
    labelA.textContent =
      scope === "stage"
        ? "The formatter has found issues on your project:"
        : "The formatter has found issues on your sprite:";

    const labelB = document.createElement("span");
    labelB.className = "sa-format-issues-modal-label";
    labelB.innerText =
      'Make sure to fix these issues manualy or with "Format Project".\n\nIf you only want to format this sprite and it\'s insides, use "Format Sprite" instead.';

    // Create text area
    const issuesTextArea = document.createElement("textarea");
    issuesTextArea.className = "sa-format-issues-textarea";
    issuesTextArea.setAttribute("readonly", true);
    issuesTextArea.innerText = new DOMParser().parseFromString(issues, "text/html").body.textContent;

    // Create our buttons
    const buttonRow = document.createElement("div");
    buttonRow.setAttribute("class", this.addon.tab.scratchClass("prompt_button-row", "box_box"));
    buttonRow.setAttribute("style", "padding: 1rem 0 0 0;");

    const okButton = document.createElement("button");
    okButton.setAttribute("class", this.addon.tab.scratchClass("prompt_ok-button"));

    const okButtonLabel = document.createElement("span");
    okButtonLabel.innerText = "OK";

    okButton.appendChild(okButtonLabel);

    okButton.addEventListener("click", () => modal.remove());

    buttonRow.appendChild(okButton);

    // Create the modal content
    modalContainer.append(labelA, issuesTextArea, labelB, buttonRow);

    modal.content.appendChild(modalContainer);

    // Modal style
    modal.container.style.width = "650px";
    modal.content.style.padding = "1rem 1.5rem";

    modal.closeButton.addEventListener("click", () => modal.remove());
  }

  getWorkspace() {
    return this.addon.tab.traps.getWorkspace();
  }

  async addContextMenus() {
    const blockly = await this.addon.tab.traps.getBlockly();

    enableContextMenuSeparators(this.addon.tab);
    if (blockly.registry) {
      // new Blockly
      blockly.ContextMenuRegistry.registry.register(
        addSeparator({
          displayText: this.m("format-project"),
          preconditionFn: "disabled",
          callback: () => {
            this.format();
          },
          scopeType: blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
          id: "saFormatProject",
          weight: 11, // after "Paste"
        })
      );
    } else {
      this.addon.tab.createBlockContextMenu(
        (items, block) => {
          items.push(
            addSeparator({
              enabled: true,
              text: this.m("format-project"),
              separator: true,
              callback: () => {
                this.format();
              },
            })
          );
          return items;
        },
        { workspace: true }
      );
    }

    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        items.push({
          enabled: true,
          text: this.m("check-formatting"),
          callback: () => {
            this.checkFormatting("stage");
          },
        });
        return items;
      },
      { workspace: true }
    );

    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        if (
          block.getCategory() === "data" ||
          block.getCategory() === "data-lists" ||
          (block.type.startsWith("procedure") && !isDebuggerBlock(block))
        ) {
          const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
          const insertBeforeIndex =
            makeSpaceItemIndex !== -1
              ? // If "make space" button exists, add own items before it
                makeSpaceItemIndex
              : // If there's no such button, insert at end
                items.length;

          items.splice(insertBeforeIndex, 0, {
            enabled: true,
            text: this.m("unignore-block", { type: this.m(getBlockType(block)) }),
            separator: false,
            callback: () => this.console.log("hello world!"),
          });

          items.splice(
            insertBeforeIndex,
            0,
            addSeparator({
              enabled: true,
              text: this.m("ignore-block", { type: this.m(getBlockType(block)) }),
              separator: true,
              callback: () => this.console.log("hello world!"),
            })
          );
        } else {
          this.console.log(block);
        }
        return items;
      },
      { blocks: true, flyout: true }
    );
    this.addon.tab.createEditorContextMenu((ctxType, ctx) => {
      const target = this.vm.editingTarget;

      this.console.log(ctx);

      let ctxID;

      if (ctx.name?.folder) {
        ctxID = `${target.id}_${ctxType}_${ctx.name.folder}`;
        ctxType = "folder";
      } else {
        const chosenSpriteCtx = target.sprite[`${ctxType}s`].find((val) => val.name === ctx.name.realName);
        ctxID = chosenSpriteCtx.assetId;
      }

      return [
        {
          className: "sa-ignore",
          types: ["costume", "sound"],
          position: ctx.name.folder ? "assetContextMenuAfterDelete" : "assetContextMenuAfterExport",
          order: 13,
          border: true,
          callback: () => {
            this.formatterUtils.ignoredItems.add(ctxID);
            this.console.log(this.formatterUtils.ignoredItems);
          },
          label: this.m("ignore", { type: ctxType }),
        },
        {
          className: "sa-unignore",
          types: ["costume", "sound"],
          position: ctx.name.folder ? "assetContextMenuAfterDelete" : "assetContextMenuAfterExport",
          order: 14,
          callback: () => {
            this.formatterUtils.ignoredItems.delete(ctxID);
            this.console.log(this.formatterUtils.ignoredItems);
          },
          label: this.m("unignore", { type: ctxType }),
        },
      ];
    });
  }
  /**Creates a format message.
   * @param {"warn"|"error"} level - The message level
   * @param {"sprite"|"costume"|"list"|"variable"|"procedure"} type - Type of the subject
   */
  newFormatMessage(level, type, subject, errMsg) {
    const formatErrorType = level === "error" ? "format-error" : "format-warn";
    return this.m(formatErrorType, { type: type, subject: subject, "err-msg": errMsg });
  }

  /**
   * Creates a new menu option.
   *
   * @param {string} title - The title of the menu option.
   * @param {Object} options - The parameters for the menu option.
   * @param {Function} options.callback - The callback function to be executed when the option is selected.
   * @param {string} [options.imgSrc=""] - The optional image source URL. Defaults to an empty string.
   * @param {boolean} [options.separator=false] - A flag indicating whether to include a separator before the menu option.
   * @returns {HTMLElement} HTML Element of the option to add.
   */
  craftMenuOption(title, { callback, imgSrc = "", separator = false }) {
    const opt = document.createElement("li");
    if (separator) {
      opt.setAttribute("class", this.addon.tab.scratchClass("menu_menu-item", "menu_hoverable", "menu_menu-section"));
    } else {
      opt.setAttribute("class", this.addon.tab.scratchClass("menu_menu-item", "menu_hoverable"));
    }

    const optBody = document.createElement("div");
    optBody.setAttribute(
      "class",
      this.addon.tab.scratchClass("settings-menu_option", { others: "sa-editor-formatter-options-body" })
    );

    if (imgSrc) {
      const img = document.createElement("img");
      img.setAttribute(
        "class",
        this.addon.tab.scratchClass("settings-menu_icon", { others: "sa-editor-formatter-options-icon" })
      );
      img.setAttribute("src", imgSrc);

      optBody.appendChild(img);
    }

    const optTitle = document.createElement("span");
    optTitle.textContent = title;

    optBody.appendChild(optTitle);

    opt.appendChild(optBody);

    opt.addEventListener("click", callback);

    return opt;
  }

  checkFormatting(scope) {
    this.createFormatIssuesModal(this.newFormatMessage("warn", "sprite", "Sprite1", "ur code is ugly"), scope);
  }

  async format() {
    if (!this.formatConfirm)
      this.formatConfirm = await this.addon.tab.confirm(
        "Warning!",
        "This will format the entire project according to the enabled rules (including custom rules) and clean up the workspace.\n\nThis process is irreversible and might break the entire project.\nDo you want to proceed?",
        { useEditorClasses: true, okButtonLabel: "Proceed" }
      );
  }

  openFormatterOptions() {
    const modal = this.addon.tab.createModal("Formatter Options", {
      useEditorClasses: true,
      isOpen: true,
    });

    const questionMarkIcon =
      "data:image/svg+xml;base64,PCEtLSBodHRwczovL21hdGVyaWFsLmlvL3Jlc291cmNlcy9pY29ucy8/c2VhcmNoPWhlbHAmaWNvbj1oZWxwJnN0eWxlPWJhc2VsaW5lIC0tPgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMSAxN2gtMnYtMmgydjJ6bTIuMDctNy43NWwtLjkuOTJDMTMuNDUgMTIuOSAxMyAxMy41IDEzIDE1aC0ydi0uNWMwLTEuMS40NS0yLjEgMS4xNy0yLjgzbDEuMjQtMS4yNmMuMzctLjM2LjU5LS44Ni41OS0xLjQxIDAtMS4xLS45LTItMi0ycy0yIC45LTIgMkg4YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDRjMCAuODgtLjM2IDEuNjgtLjkzIDIuMjV6Ii8+PC9zdmc+";

    const { content, container, closeButton } = modal;

    container.classList.add("sa-format-options-popup");

    /**
     * An object representing a format rule.
     * @typedef FormatRule
     * @property {string} name - The name of the option
     * @property {string} id - The ID of the option
     * @property {string} description - The description of the rule
     * @property {string} enabled - Checks if the rule is enabled
     */

    /**
     * All format rule options.
     * @type {FormatRule[]}
     */
    const formatRuleOptions = this.formatterUtils.rules;

    const ruleContainer = document.createElement("section");

    const createDivider = () => {
      const divider = document.createElement("div");
      divider.className = "sa-format-options-divider";

      return divider;
    };

    const createHeader = (title) => {
      const headerDiv = document.createElement("div");
      headerDiv.className = "sa-format-options-header ";

      const header = document.createElement("h3");
      header.textContent = title;

      const headerDivider = createDivider();

      headerDiv.append(header, headerDivider);

      return headerDiv;
    };

    ruleContainer.className = "sa-format-options-modal";

    ruleContainer.appendChild(createHeader("Formatting Rules"));

    const createHelpButton = (id) => {
      const button = document.createElement("button");
      button.classList.add("sa-format-options_help-icon");
      button.title = "Click for help";

      button.addEventListener("click", () => {
        const targetElement = document.getElementById(`${id}_description`);

        if (targetElement) {
          if (targetElement.style.display === "block") {
            targetElement.style.display = "none";
          } else {
            targetElement.style.display = "block";
          }
        }
      });

      const img = document.createElement("img");
      Object.assign(img, {
        draggable: false,
        src: questionMarkIcon,
      });

      button.appendChild(img);

      return button;
    };

    const rulesDiv = document.createElement("div");
    rulesDiv.style.paddingLeft = "1.2rem";

    formatRuleOptions.forEach((rule) => {
      const ruleDiv = document.createElement("div");
      ruleDiv.id = rule.id;
      ruleDiv.className = "sa-formatter-options-rule-name";

      const ruleName = document.createElement("label");
      ruleName.textContent = `${rule.name}:`;

      const ruleDescription = document.createElement("span");
      ruleDescription.className = "sa-settings-description-text";
      ruleDescription.innerText = rule.description;

      ruleDescription.style.display = "none";
      ruleDescription.id = `${rule.id}_description`;

      const toggleLabel = document.createElement("label");
      toggleLabel.className = "sa-formatter-options-toggle-switch";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "sa-formatter-options-toggle-input";
      checkbox.checked = rule.enabled;
      checkbox.addEventListener("change", ({ target: checkbox }) => {
        this.formatterUtils.rules = { id: rule.id, enabled: checkbox.checked };
      });

      const slider = document.createElement("span");
      slider.className = "sa-formatter-options-toggle-slider";

      toggleLabel.append(checkbox, slider);

      const ruleHeader = document.createElement("div");
      ruleHeader.className = "sa-formatter-options-rule-header";

      const helpButton = createHelpButton(rule.id);

      ruleHeader.append(ruleName, helpButton, toggleLabel);

      ruleDiv.append(ruleHeader, ruleDescription);

      rulesDiv.appendChild(ruleDiv);
    });

    ruleContainer.appendChild(rulesDiv);

    const buttonRow = document.createElement("div");
    buttonRow.setAttribute(
      "class",
      this.addon.tab.scratchClass("prompt_button-row", { others: ["sa-formatter-options-button-row"] })
    );

    const okButton = document.createElement("button");
    okButton.setAttribute(
      "class",
      this.addon.tab.scratchClass("prompt_ok-button", {
        others: ["sa-formatter-options-button", "sa-formatter-options-ok-button"],
      })
    );

    okButton.textContent = this.m("formatter-config-save");
    okButton.addEventListener("click", () => {
      this.formatterUtils.saveConfigToProject();
      modal.remove();
    });
    buttonRow.appendChild(okButton);

    ruleContainer.appendChild(buttonRow);

    content.appendChild(ruleContainer);

    closeButton.addEventListener("click", () => modal.remove());
  }

  /**Initialize the editor formatter. */
  async init() {
    this.addContextMenus();
    this.formatterUtils.loadConfigFromComment();

    const formatterOptions = this.craftMenuOption("Formatter Options", {
      callback: (e) => {
        this.openFormatterOptions();
        closeMenu("settingsMenu", this.redux);
      },
      imgSrc: this.formatterOptsImg,
      separator: false,
    });

    while (true) {
      const settingsMenu = await this.addon.tab.waitForElement(
        'div[class^="menu-bar_menu-bar-menu_"] ul[class^="menu_menu_"]',
        {
          markAsSeen: true,
          reduxEvents: ["scratch-gui/menus/OPEN_MENU"],
          reduxCondition: (state) => state.scratchGui.menus.settingsMenu,
        }
      );

      if (!settingsMenu.closest('div[class*="menu_submenu_"]')) settingsMenu.append(formatterOptions);
    }
  }
}
