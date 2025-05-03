import DomHelpers from "./DomHelpers.js";
import UndoGroup from "../../libraries/common/cs/UndoGroup.js";
import { getVariableUsesById } from "../../libraries/common/cs/devtools-utils.js";
import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

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

    // On new Blockly, we can't access the clipboard data directly because it's
    // a global variable in a module. Instead, we set this to true when something
    // is copied. If the addon is enabled late, something might already be on the
    // clipboard, so we initialize it to true.
    this.clipboardHasData = addon.self.enabledLate;

    this.copyAll = false;
  }

  async init() {
    this.addContextMenus();
    this.patchPaste();
    this.patchCopyShortcuts();
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

  async patchPaste() {
    const devtools = this;
    const blockly = await this.addon.tab.traps.getBlockly();
    // Support for new blockly.
    if (blockly.registry) {
      const BlockPaster = blockly.registry.getClass(blockly.registry.Type.PASTER, 'block').constructor;
      const oldPasteFunc = BlockPaster.prototype.paste;
      BlockPaster.prototype.paste = function(copyData, workspace, coords) {
        if (devtools.addon.settings.get("enablePasteBlocksAtMouse")) {
          if (!devtools._canPaste()) return;
        }
        return oldPasteFunc.call(this, copyData, workspace, coords);
      };
    } else {
      const oldPasteFunc = blockly.WorkspaceSvg.prototype.paste;
      blockly.WorkspaceSvg.prototype.paste = function (data) {
        if (devtools.addon.settings.get("enablePasteBlocksAtMouse")) {
          if (data.tagName.toLowerCase() !== "comment" && !devtools._canPaste()) {
            return;
          }
        }
        return oldPasteFunc.call(this, data);
      };
    }
  }

  async addContextMenus() {
    const blockly = await this.addon.tab.traps.getBlockly();

    enableContextMenuSeparators(this.addon.tab);

    const pasteCallback = () => {
      let target;
      if (blockly.registry)
        target = document.querySelector(".injectionDiv"); // new Blockly
      else target = document;
      target.dispatchEvent(
        new KeyboardEvent("keydown", {
          keyCode: 86,
          ctrlKey: true,
        })
      );
    };

    if (blockly.registry) {
      // new Blockly
      blockly.ContextMenuRegistry.registry.register(
        addSeparator({
          displayText: this.m("paste"),
          preconditionFn: () => (this.clipboardHasData ? "enabled" : "disabled"),
          callback: pasteCallback,
          scopeType: blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
          id: "saPaste",
          weight: 10, // after Save All as Image
        })
      );
    } else {
      this.addon.tab.createBlockContextMenu(
        (items, block) => {
          items.push({
            enabled: blockly.clipboardXml_,
            text: this.m("paste"),
            separator: true,
            _isDevtoolsFirstItem: true,
            callback: pasteCallback,
          });
          return items;
        },
        { workspace: true }
      );
    }

    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        items.push(
          addSeparator({
            enabled: true,
            text: this.m("make-space"),
            _isDevtoolsFirstItem: true,
            callback: () => {
              this.makeSpace(block);
            },
            separator: true,
          }),
          addSeparator({
            enabled: true,
            text: this.m("copy-all"),
            callback: () => {
              this.eventCopyClick(blockly, block);
            },
            separator: true,
          }),
          {
            enabled: true,
            text: this.m("copy-block"),
            callback: () => {
              this.eventCopyClick(blockly, block, 1);
            },
          },
          {
            enabled: true,
            text: this.m("cut-block"),
            callback: () => {
              this.eventCopyClick(blockly, block, 2);
            },
          }
        );
        return items;
      },
      { blocks: true }
    );

    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        if (block.type.startsWith("data_")) {
          this.selVarID = block.getVars()[0];
          items.push(
            addSeparator({
              enabled: true,
              text: this.m("swap", { var: block.type.includes("list") ? this.m("lists") : this.m("variables") }),
              callback: () => {
                let wksp = this.getWorkspace();
                let v = wksp.getVariableMap().getVariableById(this.selVarID);
                let varName = window.prompt(this.msg("replace", { name: v.name }));
                if (varName) {
                  this.doReplaceVariable(this.selVarID, varName, v.type);
                }
              },
              separator: true,
            })
          );
        }
        return items;
      },
      { blocks: true, flyout: true }
    );
  }

  async patchCopyShortcuts() {
    const devtools = this;
    const blockly = await this.addon.tab.traps.getBlockly();
    if (!blockly.registry) return;
    const shortcuts = blockly.ShortcutRegistry.registry.getRegistry();

    // Set this.clipboardHasData to true when something is copied on new Blockly

    const newCallback = (oldCallback) =>
      function (...args) {
        const success = oldCallback.call(this, ...args);
        if (success) devtools.clipboardHasData = true;
        return success;
      };

    const copyShortcut = shortcuts[blockly.ShortcutItems.names.COPY];
    const oldCopyCallback = copyShortcut.callback;
    copyShortcut.callback = newCallback(oldCopyCallback);
    blockly.ShortcutRegistry.registry.register(copyShortcut, true);

    const cutShortcut = shortcuts[blockly.ShortcutItems.names.CUT];
    const oldCutCallback = cutShortcut.callback;
    cutShortcut.callback = newCallback(oldCutCallback);
    blockly.ShortcutRegistry.registry.register(cutShortcut, true);

    // New Blockly copies a single block by default, so this is needed to make Copy All work
    const oldBlockToCopyData = blockly.BlockSvg.prototype.toCopyData;
    blockly.BlockSvg.prototype.toCopyData = function (...args) {
      let data = oldBlockToCopyData.call(this, ...args);
      if (!data) return null;
      data = {
        ...data,
        blockState: blockly.serialization.blocks.save(this, {
          addCoordinates: true,
          addNextBlocks: devtools.copyAll,
        }),
      };
      devtools.copyAll = false;
      return data;
    };
  }

  getWorkspace() {
    return this.addon.tab.traps.getWorkspace();
  }

  isCostumeEditor() {
    return this.costTab.className.indexOf("gui_is-selected") >= 0;
  }

  /**
   * Pushes everything below the blocks scripts column down, and everything on it's right to the right.
   * If the workspace is in RTL mode, then we shift everything on it's left to the left instead
   * @param targetBlock the block that we are adding space around
   */

  makeSpace(targetBlock) {
    const wksp = this.getWorkspace();

    // ensure that all events are grouped together in the undo stack
    UndoGroup.startUndoGroup(wksp);

    const topBlocks = wksp.getTopBlocks();
    const { pos: tPos, xMax: tXMax } = this.getBlockPosAndXMax(targetBlock);
    const targetRoot = targetBlock.getRootBlock();
    const isRTL = targetBlock.RTL;

    // TODO: move shift distances to a setting option defined in multiples of grid spacing
    const maxXShift = 380,
      maxYShift = 410;
    let minXShift = maxXShift,
      minYShift = maxYShift;

    // first pass we determine if a block stack should be shifted
    // and if it should be shifted and is closer than maxShift we update the min shift distance
    const shouldShift = [];
    for (const topBlock of topBlocks) {
      if (topBlock === targetRoot) continue;
      const { pos, xMax } = this.getBlockPosAndXMax(topBlock);

      const withinColumn = isRTL ? tPos.x >= xMax && pos.x >= tXMax : tPos.x <= xMax && pos.x <= tXMax;

      const shouldShiftX = pos.x < tXMax === isRTL;
      const shouldShiftY = pos.y > tPos.y && withinColumn;
      shouldShift.push([topBlock, shouldShiftX, shouldShiftY]);

      if (shouldShiftX && Math.abs(pos.x - tXMax) < minXShift) minXShift = Math.abs(pos.x - tXMax);
      if (shouldShiftY && pos.y - tPos.y < minYShift) minYShift = pos.y - tPos.y;
    }

    // in the second pass we apply a shift based on the min shift to all the blocks we found should be shifted in the first pass
    const shiftX = (isRTL ? -1 : 1) * (maxXShift - minXShift);
    const shiftY = maxYShift - minYShift;
    for (const [block, shldShiftX, shldShiftY] of shouldShift) block.moveBy(shiftX * shldShiftX, shiftY * shldShiftY);

    UndoGroup.endUndoGroup(wksp);
  }

  // in non-RTL mode this function returns the top left corner of the block and the right most x value of the stack
  // in RTL mode it returns the top right corner and the left most x value of the stack
  getBlockPosAndXMax(block) {
    const { x, y } = block.getRelativeToSurfaceXY();
    const width = block.getRootBlock().getHeightWidth().width;
    return block.RTL ? { pos: { x: x + width, y }, xMax: x } : { pos: { x, y }, xMax: x + width };
  }

  /**
   * Quick and dirty replace all instances of one variable / list with another variable / list
   * @param varId original variable name
   * @param newVarName new variable name
   * @param type type of variable ("" = variable, anything else is a list?
   */
  doReplaceVariable(varId, newVarName, type) {
    let wksp = this.getWorkspace();
    let v = wksp.getVariableMap().getVariable(newVarName, type);
    if (!v) {
      alert(this.msg("var-not-exist"));
      return;
    }
    let newVId = v.getId();

    UndoGroup.startUndoGroup(wksp);
    let blocks = getVariableUsesById(varId, wksp);
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

  /**
   * Returns a Set of the top blocks in this workspace / sprite
   * @returns {Set<any>} Set of top blocks
   */
  getTopBlockIDs() {
    let wksp = this.getWorkspace();
    let topBlocks = wksp.getTopBlocks();
    let ids = new Set();
    for (const block of topBlocks) {
      ids.add(block.id);
    }
    return ids;
  }

  /**
   * Initiates a drag event for all block stacks except those in the set of ids.
   * But why? - Because we know all the ids of the existing stacks before we paste / duplicate - so we can find the
   * new stack by excluding all the known ones.
   * @param ids Set of previously known ids
   */
  beginDragOfNewBlocksNotInIDs(ids) {
    if (!this.addon.settings.get("enablePasteBlocksAtMouse")) {
      return;
    }
    let wksp = this.getWorkspace();
    let topBlocks = wksp.getTopBlocks();

    // handle grouping the undo events
    // we set the endUndoGroup to happen after the user has placed the block somewhere
    UndoGroup.startUndoGroup(wksp, true);
    const onEndDrag = (e) => {
      if (e.type === "endDrag") {
        UndoGroup.endUndoGroup(wksp);
        wksp.removeChangeListener(onEndDrag);
      }
    };
    wksp.addChangeListener(onEndDrag);

    for (const block of topBlocks) {
      if (!ids.has(block.id)) {
        let mouseXYClone = { x: this.mouseXY.x, y: this.mouseXY.y };
        let svgPath;
        if (block.pathObject)
          svgPath = block.pathObject.svgPath; // new Blockly
        else svgPath = block.svgPath_;
        this.domHelpers.triggerDragAndDrop(svgPath, null, mouseXYClone);
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

  eventKeyDownDocument(e) {
    const switchCostume = (up) => {
      // todo: select previous costume
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

    if (this.addon.tab.editorMode !== "editor") {
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
  }

  _canPaste() {
    // Don't paste if the mouse is outside the blockly SVG
    const bounds = document.querySelector("svg.blocklySvg").getBoundingClientRect();
    const { x, y } = this.mouseXY;
    if (x < bounds.x) return false;
    if (y < bounds.y) return false;
    if (x > bounds.x + bounds.width) return false;
    if (y > bounds.y + bounds.height) return false;
    return true;
  }

  eventKeyDownBlockly(e) {
    if (this.addon.tab.editorMode !== "editor") {
      return;
    }

    let ctrlKey = e.ctrlKey || e.metaKey;

    if (e.keyCode === 86 && ctrlKey) {
      // Ctrl + V
      if (!this._canPaste()) return;
      // Set a timeout so we can take control of the paste after the event
      let ids = this.getTopBlockIDs();
      setTimeout(() => {
        this.beginDragOfNewBlocksNotInIDs(ids);
      }, 10);
    }
  }

  eventCopyClick(blockly, block, blockOnly) {
    let wksp = this.getWorkspace();

    if (block) {
      block.select();
      let next = blockOnly ? block.getNextBlock() : null;
      if (blockly.registry) {
        // new Blockly
        this.copyAll = !blockOnly;
      } else if (next) {
        blockly.Events.setGroup(false);
        next.unplug(false); // setParent(null);
      }

      // separate child temporarily
      let target;
      if (blockly.registry)
        target = document.querySelector(".injectionDiv"); // new Blockly
      else target = document;
      target.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 67, ctrlKey: true }));
      if (next || blockOnly === 2) {
        // wait until the event has been fired
        // see https://github.com/google/blockly/blob/fa4fce5/core/events/utils.ts#L113-L115
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (!blockly.registry && next) {
              wksp.undo(); // old Blockly: undo the unplug above...
            }
            if (blockOnly === 2) {
              UndoGroup.startUndoGroup(wksp);
              block.dispose(true);
              UndoGroup.endUndoGroup(wksp);
            }
          }, 0);
        });
      }
    }
  }

  eventMouseDown(e) {
    this.updateMousePosition(e);
  }

  eventMouseUp(e) {
    this.updateMousePosition(e);
  }

  async initInner(root) {
    let guiTabs = root.childNodes;

    if (this.codeTab && guiTabs[0] !== this.codeTab) {
      // We have been CHANGED!!! - Happens when going to project page, and then back inside again!!!
      this.domHelpers.unbindAllEvents();
    }

    this.codeTab = guiTabs[0];
    this.costTab = guiTabs[1];
    this.costTabBody = document.querySelector("div[aria-labelledby='" + this.costTab.id + "']");

    this.domHelpers.bindOnce(document, "keydown", (...e) => this.eventKeyDownDocument(...e), true);

    const blockly = await this.addon.tab.traps.getBlockly();
    let keyEventTarget;
    if (blockly.registry)
      keyEventTarget = document.querySelector(".injectionDiv"); // new Blockly
    else keyEventTarget = document;
    this.domHelpers.bindOnce(keyEventTarget, "keydown", (...e) => this.eventKeyDownBlockly(...e), true);

    this.domHelpers.bindOnce(document, "mousemove", (...e) => this.eventMouseMove(...e), true);
    this.domHelpers.bindOnce(document, "mousedown", (...e) => this.eventMouseDown(...e), true); // true to capture all mouse downs 'before' the dom events handle them
    this.domHelpers.bindOnce(document, "mouseup", (...e) => this.eventMouseUp(...e), true);
  }
}
