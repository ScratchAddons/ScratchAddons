import DomHelpers from "./DomHelpers.js";
import UndoGroup from "./UndoGroup.js";

export default class DevTools {
  constructor(addon, msg, m) {
    this.addon = addon;
    this.msg = msg;
    this.m = m;
    this.domHelpers = new DomHelpers(addon);

    this.codeTab = null;
    this.costTab = null;
    this.costTabBody = null;
    this.selVarID = null;
    this.canShare = false;

    this.mouseXY = { x: 0, y: 0 };
    this.blockly = null;
  }

  async init() {
    this.addContextMenus();
    while (true) {
      const root = await this.addon.tab.waitForElement("ul[class*=gui_tab-list_]", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      });
      this.initInner(root);
    }
  }

  async addContextMenus() {
    this.blockly = await this.addon.tab.traps.getBlockly();
    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        items.push(
          {
            enabled: true,
            text: this.m("copy-all"),
            callback: () => {
              this.eventCopyClick(block);
            },
            separator: true,
          },
          {
            enabled: true,
            text: this.m("copy-block"),
            callback: () => {
              this.eventCopyClick(block, 1);
            },
          },
          {
            enabled: true,
            text: this.m("cut-block"),
            callback: () => {
              this.eventCopyClick(block, 2);
            },
          }
        );
        return items;
      },
      { blocks: true }
    );
    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        if (block.getCategory() === "data" || block.getCategory() === "data-lists") {
          this.selVarID = block.getVars()[0];
          items.push({
            enabled: true,
            text: this.m("swap", { var: block.getCategory() === "data" ? this.m("variables") : this.m("lists") }),
            callback: () => {
              let wksp = this.getWorkspace();
              let v = wksp.getVariableById(this.selVarID);
              let varName = window.prompt(this.msg("replace", { name: v.name }));
              if (varName) {
                this.cleanupMenu.cleanupTools.doReplaceVariable(this.selVarID, varName, v.type);
              }
            },
            separator: true,
          });
        }
        return items;
      },
      { blocks: true, flyout: true }
    );
  }

  /**
   * Quick and dirty replace all instances of one variable / list with another variable / list
   * @param varId original variable name
   * @param newVarName new variable name
   * @param type type of variable ("" = variable, anything else is a list?
   */
    doReplaceVariable(varId, newVarName, type) {
      let wksp = this.getWorkspace();
      let v = wksp.getVariable(newVarName, type);
      if (!v) {
        alert(this.msg("var-not-exist"));
        return;
      }
      let newVId = v.getId();

      UndoGroup.startUndoGroup(wksp);
      let blocks = this.getVariableUsesById(varId);
      for (const block of blocks) {
        try {
          if (type === "") {
            block.getField("VARIABLE").setValue(newVId);
          } else {
            block.getField("LIST").setValue(newVId);
          }
        } catch (e) {
          // ignore
        }
      }
      UndoGroup.endUndoGroup(wksp);
    }

  getWorkspace() {
    return this.blockly.getMainWorkspace();
  }

  isCostumeEditor() {
    return this.costTab.className.indexOf("gui_is-selected") >= 0;
  }

  getTopBlockIDs() {
    let wksp = this.getWorkspace();
    let topBlocks = wksp.getTopBlocks();
    let ids = new Set();
    for (const block of topBlocks) {
      ids.add(block.id);
    }
    return ids;
  }

  beginDragOfNewBlocksNotInIDs(ids) {
    if (!this.addon.settings.get("enablePasteBlocksAtMouse")) {
      return;
    }
    let wksp = this.getWorkspace();
    let topBlocks = wksp.getTopBlocks();
    for (const block of topBlocks) {
      if (!ids.has(block.id)) {
        let mouseXYClone = { x: this.mouseXY.x, y: this.mouseXY.y };
        this.domHelpers.triggerDragAndDrop(block.svgPath_, null, mouseXYClone);
      }
    }
  }

  updateMousePosition(e) {
    this.mouseXY.x = e.clientX;
    this.mouseXY.y = e.clientY;
  }

  eventMouseMove(e) {
    this.updateMousePosition(e);
  }

  eventKeyDown(e) {
    const switchCostume = (up) => {
      let selected = this.costTabBody.querySelector("div[class*='sprite-selector-item_is-selected']");
      let node = up ? selected.parentNode.previousSibling : selected.parentNode.nextSibling;
      if (node) {
        let wrapper = node.closest("div[class*=gui_flex-wrapper]");
        node.querySelector("div[class^='sprite-selector-item_sprite-name']").click();
        node.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "start",
        });
        wrapper.scrollTop = 0;
      }
    };

    if (document.URL.indexOf("editor") <= 0) {
      return;
    }

    let ctrlKey = e.ctrlKey || e.metaKey;

    if (e.key === "ArrowLeft" && ctrlKey) {
      if (document.activeElement.tagName === "INPUT") {
        return;
      }

      if (this.isCostumeEditor()) {
        switchCostume(true);
        e.cancelBubble = true;
        e.preventDefault();
        return true;
      }
    }

    if (e.key === "ArrowRight" && ctrlKey) {
      if (document.activeElement.tagName === "INPUT") {
        return;
      }

      if (this.isCostumeEditor()) {
        switchCostume(false);
        e.cancelBubble = true;
        e.preventDefault();
        return true;
      }
    }

    if (e.keyCode === 86 && ctrlKey && !e.griff) {
      let ids = this.getTopBlockIDs();
      setTimeout(() => {
        this.beginDragOfNewBlocksNotInIDs(ids);
      }, 10);
    }
  }

  eventCopyClick(block, blockOnly) {
    let wksp = this.getWorkspace();

    if (block) {
      block.select();
      let next = blockOnly ? block.getNextBlock() : null;
      if (next) {
        next.unplug(false);
      }

      document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 67, ctrlKey: true }));
      if (next || blockOnly === 2) {
        setTimeout(() => {
          if (next) {
            wksp.undo();
          }
          if (blockOnly === 2) {
            UndoGroup.startUndoGroup(wksp);
            block.dispose(true);
            UndoGroup.endUndoGroup(wksp);
          }
        }, 0);
      }
    }
  }

  eventMouseDown(e) {
    this.updateMousePosition(e);
  }

  eventMouseUp(e) {
    this.updateMousePosition(e);
  }

  initInner(root) {
    let guiTabs = root.childNodes;

    if (this.codeTab && guiTabs[0] !== this.codeTab) {
      this.domHelpers.unbindAllEvents();
    }

    this.codeTab = guiTabs[0];
    this.costTab = guiTabs[1];
    this.costTabBody = document.querySelector("div[aria-labelledby=" + this.costTab.id + "]");

    this.domHelpers.bindOnce(document, "keydown", (...e) => this.eventKeyDown(...e), true);
    this.domHelpers.bindOnce(document, "mousemove", (...e) => this.eventMouseMove(...e), true);
    this.domHelpers.bindOnce(document, "mousedown", (...e) => this.eventMouseDown(...e), true);
    this.domHelpers.bindOnce(document, "mouseup", (...e) => this.eventMouseUp(...e), true);
  }
}
