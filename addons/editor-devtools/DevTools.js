// import ShowBroadcast from "./show-broadcast.js";
import DomHelpers from "./DomHelpers.js";
import XML from "./XML.js";
import UndoGroup from "./UndoGroup.js";

export default class DevTools {
  constructor(addon, msg, m) {
    this.addon = addon;
    this.msg = msg;
    this.m = m;
    /**
     * @type {VirtualMachine}
     */
    this.domHelpers = new DomHelpers(addon);

    this.codeTab = null;
    this.costTab = null;
    this.costTabBody = null;
    this.selVarID = null;
    this.floatInp = null;
    this.blockCursor = null;
    this.canShare = false;

    this.mouseXY = { x: 0, y: 0 };
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
    const blockly = await this.addon.tab.traps.getBlockly();
    const oldCleanUpFunc = blockly.WorkspaceSvg.prototype.cleanUp;
    const self = this;
    blockly.WorkspaceSvg.prototype.cleanUp = function () {
      if (self.addon.settings.get("enableCleanUpPlus")) {
        self.doCleanUp();
      } else {
        oldCleanUpFunc.call(this);
      }
    };

    let originalMsg = blockly.Msg.CLEAN_UP;
    if (this.addon.settings.get("enableCleanUpPlus")) blockly.Msg.CLEAN_UP = this.m("clean-plus");
    this.addon.settings.addEventListener("change", () => {
      if (this.addon.settings.get("enableCleanUpPlus")) blockly.Msg.CLEAN_UP = this.m("clean-plus");
      else blockly.Msg.CLEAN_UP = originalMsg;
    });

    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        items.push({
          enabled: blockly.clipboardXml_,
          text: this.m("paste"),
          separator: true,
          _isDevtoolsFirstItem: true,
          callback: () => {
            let ids = this.getTopBlockIDs();

            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                keyCode: 86,
                ctrlKey: true,
                griff: true,
              })
            );

            setTimeout(() => {
              this.beginDragOfNewBlocksNotInIDs(ids);
            }, 10);
          },
        });
        return items;
      },
      { workspace: true }
    );
    this.addon.tab.createBlockContextMenu(
      (items, block) => {
        items.push(
          {
            enabled: true,
            text: this.m("make-space"),
            _isDevtoolsFirstItem: true,
            callback: () => {
              this.doCleanUp(block);
            },
            separator: true,
          },
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
        // const BROADCAST_BLOCKS = ["event_whenbroadcastreceived", "event_broadcast", "event_broadcastandwait"];
        // if (BROADCAST_BLOCKS.includes(block.type)) {
        //   // Show Broadcast
        //   const broadcastId = this.showBroadcastSingleton.getAssociatedBroadcastId(block.id);
        //   if (broadcastId) {
        //     ["Senders", "Receivers"].forEach((showKey, i) => {
        //       items.push({
        //         enabled: true,
        //         text: this.msg(`show-${showKey}`.toLowerCase()),
        //         callback: () => {
        //           this.showBroadcastSingleton[`show${showKey}`](broadcastId);
        //         },
        //         separator: i == 0,
        //       });
        //     });
        //   }
        // }
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
                this.doReplaceVariable(this.selVarID, varName, v.type);
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

  getWorkspace() {
    return Blockly.getMainWorkspace();
  }

  isScriptEditor() {
    return this.codeTab.className.indexOf("gui_is-selected") >= 0;
  }

  isCostumeEditor() {
    return this.costTab.className.indexOf("gui_is-selected") >= 0;
  }

  hideFloatDropDown() {
    clearTimeout(rhdd2);
    rhdd2 = setTimeout(() => this.reallyHideFloatDropDown(), 50);
  }

  reallyHideFloatDropDown(force) {
    // Check focus of find box
    if (!force && this.floatInp === document.activeElement) {
      this.hideFloatDropDown();
      return;
    }

    let float = document.getElementById("s3devFloatingBar");
    if (float) {
      float.remove();
    }
    this.floatInp = null;
    rhdd2 = 0;
  }

  dom_removeChildren(myNode) {
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
  }

  /**
   * A nicely ordered version of the top blocks
   * @returns {[Blockly.Block]}
   */
  getTopBlocks() {
    let result = this.getOrderedTopBlockColumns();
    let columns = result.cols;
    /**
     * @type {[[Blockly.Block]]}
     */
    let topBlocks = [];
    for (const col of columns) {
      topBlocks = topBlocks.concat(col.blocks);
    }
    return topBlocks;
  }

  /**
   * A much nicer way of laying out the blocks into columns
   */
  doCleanUp(block) {
    let workspace = this.getWorkspace();
    let makeSpaceForBlock = block && block.getRootBlock();

    UndoGroup.startUndoGroup(workspace);

    let result = this.getOrderedTopBlockColumns(true);
    let columns = result.cols;
    let orphanCount = result.orphans.blocks.length;
    if (orphanCount > 0 && !block) {
      let message = this.msg("orphaned", {
        count: orphanCount,
      });
      if (confirm(message)) {
        for (const block of result.orphans.blocks) {
          block.dispose();
        }
      } else {
        columns.unshift(result.orphans);
      }
    }

    let cursorX = 48;

    let maxWidths = result.maxWidths;

    for (const column of columns) {
      let cursorY = 64;
      let maxWidth = 0;

      for (const block of column.blocks) {
        let extraWidth = block === makeSpaceForBlock ? 380 : 0;
        let extraHeight = block === makeSpaceForBlock ? 480 : 72;
        let xy = block.getRelativeToSurfaceXY();
        if (cursorX - xy.x !== 0 || cursorY - xy.y !== 0) {
          block.moveBy(cursorX - xy.x, cursorY - xy.y);
        }
        let heightWidth = block.getHeightWidth();
        cursorY += heightWidth.height + extraHeight;

        let maxWidthWithComments = maxWidths[block.id] || 0;
        maxWidth = Math.max(maxWidth, Math.max(heightWidth.width + extraWidth, maxWidthWithComments));
      }

      cursorX += maxWidth + 96;
    }

    let topComments = workspace.getTopComments();
    for (const comment of topComments) {
      if (comment.setVisible) {
        comment.setVisible(false);
        comment.needsAutoPositioning_ = true;
        comment.setVisible(true);
      }
    }

    setTimeout(() => {
      // Locate unused local variables...
      let workspace = this.getWorkspace();
      let map = workspace.getVariableMap();
      let vars = map.getVariablesOfType("");
      let unusedLocals = [];

      for (const row of vars) {
        if (row.isLocal) {
          let usages = map.getVariableUsesById(row.getId());
          if (!usages || usages.length === 0) {
            unusedLocals.push(row);
          }
        }
      }

      if (unusedLocals.length > 0) {
        const unusedCount = unusedLocals.length;
        let message = this.msg("unused-var", {
          count: unusedCount,
        });
        for (let i = 0; i < unusedLocals.length; i++) {
          let orphan = unusedLocals[i];
          if (i > 0) {
            message += ", ";
          }
          message += orphan.name;
        }
        if (confirm(message)) {
          for (const orphan of unusedLocals) {
            workspace.deleteVariableById(orphan.getId());
          }
        }
      }

      // Locate unused local lists...
      let lists = map.getVariablesOfType("list");
      let unusedLists = [];

      for (const row of lists) {
        if (row.isLocal) {
          let usages = map.getVariableUsesById(row.getId());
          if (!usages || usages.length === 0) {
            unusedLists.push(row);
          }
        }
      }
      if (unusedLists.length > 0) {
        const unusedCount = unusedLists.length;
        let message = this.msg("unused-list", {
          count: unusedCount,
        });
        for (let i = 0; i < unusedLists.length; i++) {
          let orphan = unusedLists[i];
          if (i > 0) {
            message += ", ";
          }
          message += orphan.name;
        }
        if (confirm(message)) {
          for (const orphan of unusedLists) {
            workspace.deleteVariableById(orphan.getId());
          }
        }
      }

      UndoGroup.endUndoGroup(workspace);
    }, 100);
  }

  /**
   * Badly Orphaned - might want to delete these!
   * @param topBlock
   * @returns {boolean}
   */
  isBlockAnOrphan(topBlock) {
    return !!topBlock.outputConnection;
  }

  /**
   * Split the top blocks into ordered columns
   * @param separateOrphans true to keep all orphans separate
   * @returns {{orphans: {blocks: [Block], x: number, count: number}, cols: [Col]}}
   */
  getOrderedTopBlockColumns(separateOrphans) {
    let w = this.getWorkspace();
    let topBlocks = w.getTopBlocks();
    let maxWidths = {};

    if (separateOrphans) {
      let topComments = w.getTopComments();

      // todo: tie comments to blocks... find widths and width of block stack row...
      for (const comment of topComments) {
        // comment.autoPosition_();
        // Hiding and showing repositions the comment right next to it's block - nice!
        if (comment.setVisible) {
          comment.setVisible(false);
          comment.needsAutoPositioning_ = true;
          comment.setVisible(true);

          // let bb = comment.block_.svgPath_.getBBox();
          let right = comment.getBoundingRectangle().bottomRight.x;

          // Get top block for stack...
          let root = comment.block_.getRootBlock();
          let left = root.getBoundingRectangle().topLeft.x;
          maxWidths[root.id] = Math.max(right - left, maxWidths[root.id] || 0);
        }
      }
    }

    // Default scratch ordering is horrid... Lets try something more clever.

    /**
     * @type {Col[]}
     */
    let cols = [];
    const TOLERANCE = 256;
    let orphans = { x: -999999, count: 0, blocks: [] };

    for (const topBlock of topBlocks) {
      // let r = b.getBoundingRectangle();
      let position = topBlock.getRelativeToSurfaceXY();
      /**
       * @type {Col}
       */
      let bestCol = null;
      let bestError = TOLERANCE;

      if (separateOrphans && this.isBlockAnOrphan(topBlock)) {
        orphans.blocks.push(topBlock);
        continue;
      }

      // Find best columns
      for (const col of cols) {
        let err = Math.abs(position.x - col.x);
        if (err < bestError) {
          bestError = err;
          bestCol = col;
        }
      }

      if (bestCol) {
        // We found a column that we fitted into
        bestCol.x = (bestCol.x * bestCol.count + position.x) / ++bestCol.count; // re-average the columns as more items get added...
        bestCol.blocks.push(topBlock);
      } else {
        // Create a new column
        cols.push(new Col(position.x, 1, [topBlock]));
      }
    }

    // if (orphans.blocks.length > 0) {
    //     cols.push(orphans);
    // }

    // Sort columns, then blocks inside the columns
    cols.sort((a, b) => a.x - b.x);
    for (const col of cols) {
      col.blocks.sort((a, b) => a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y);
    }

    return { cols: cols, orphans: orphans, maxWidths: maxWidths };
  }

  /**
   * Find all the uses of a named variable.
   * @param {string} id ID of the variable to find.
   * @return {!Array.<!Blockly.Block>} Array of block usages.
   */
  getVariableUsesById(id) {
    let uses = [];

    let topBlocks = this.getTopBlocks(true); // todo: Confirm this was the right getTopBlocks?
    for (const topBlock of topBlocks) {
      /** @type {!Array<!Blockly.Block>} */
      let kids = topBlock.getDescendants();
      for (const block of kids) {
        /** @type {!Array<!Blockly.VariableModel>} */
        let blockVariables = block.getVarModels();
        if (blockVariables) {
          for (const blockVar of blockVariables) {
            if (blockVar.getId() === id) {
              uses.push(block);
            }
          }
        }
      }
    }

    return uses;
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

  /*
    function doInjectScripts(codeString) {
      let w = getWorkspace();
      let xml = new XML(); // document.implementation.createDocument(null, "xml");
      let x = xml.xmlDoc.firstChild;

      let tree = math.parse(codeString);
      console.log(tree);

      const binaryOperatorTypes = {
        add: "operator_add",
        subtract: "operator_subtract",
        this.multiply: "operator_multiply",
        divide: "operator_divide",
      };

      const BLOCK_TYPE = {
        number: "math_number",
        text: "text",
      };

      function translateMathToXml(x, tree, shadowType) {
        let xShadowField = null;
        if (shadowType) {
          let xShadow = xml.newXml(x, "shadow", { type: shadowType });
          if (shadowType === BLOCK_TYPE.number) {
            xShadowField = xml.newXml(xShadow, "field", { name: "NUM" });
          } else if (shadowType === BLOCK_TYPE.text) {
            xShadowField = xml.newXml(xShadow, "field", { name: "TEXT" });
          }
        }

        if (!tree || !tree.type) {
          return;
        }

        if (tree.type === "OperatorNode") {
          let operatorType = binaryOperatorTypes[tree.fn];
          if (operatorType) {
            let xOp = newXml(x, "block", { type: operatorType });
            translateMathToXml(xml.newXml(xOp, "value", { name: "NUM1" }), tree.args[0], BLOCK_TYPE.number);
            translateMathToXml(xml.newXml(xOp, "value", { name: "NUM2" }), tree.args[1], BLOCK_TYPE.number);
            return;
          }

          return;
        }

        if (tree.type === "ConstantNode") {
          // number or text in quotes
          if (xShadowField) {
            xml.setAttr(xShadowField, { text: tree.value });
          }
          return;
        }

        if (tree.type === "SymbolNode") {
          // variable
          let xVar = xml.newXml(x, "block", { type: "data_variable" });
          xml.newXml(xVar, "field", { name: "VARIABLE", text: tree.name });
          return;
        }

        if (tree.type === "FunctionNode") {
          // Method Call
          if (tree.fn.name === "join") {
            let xOp = newXml(x, "block", { type: "operator_join" });
            translateMathToXml(xml.newXml(xOp, "value", { name: "STRING1" }), tree.args[0], BLOCK_TYPE.text);
            translateMathToXml(xml.newXml(xOp, "value", { name: "STRING2" }), tree.args[1], BLOCK_TYPE.text);
            return;
          }
        }
      }

      translateMathToXml(x, tree);
      console.log(x);

      let ids = Blockly.Xml.domToWorkspace(x, w);
      console.log(ids);
    }
     */
  /*
    function clickInject(e) {
      let codeString = window.prompt("Griffpatch: Enter an expression (i.e. a+2*3)");
      if (codeString) {
        doInjectScripts(codeString);
      }
      e.preventDefault();
      return false;
    }
    */

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
    for (const block of topBlocks) {
      if (!ids.has(block.id)) {
        // console.log("I found a new block!!! - " + block.id);
        // todo: move the block to the mouse pointer?
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

    if (document.URL.indexOf("editor") <= 0) {
      return;
    }

    let ctrlKey = e.ctrlKey || e.metaKey;

    if (e.key === " " && ctrlKey) {
      // Ctrl + Space (Inject Code)
      this.middleClickWorkspace(e);
      e.cancelBubble = true;
      e.preventDefault();
      return true;
    }

    if (e.keyCode === 37 && ctrlKey) {
      // Ctrl + Left Arrow Key
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

    if (e.keyCode === 39 && ctrlKey) {
      // Ctrl + Right Arrow Key
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
      // Ctrl + V
      // Set a timeout so we can take control of the paste after the event
      let ids = this.getTopBlockIDs();
      setTimeout(() => {
        this.beginDragOfNewBlocksNotInIDs(ids);
      }, 10);
    }

    // if (e.keyCode === 220 && (!document.activeElement || document.activeElement.tagName === 'INPUT')) {
    //
    // }
  }

  eventCopyClick(block, blockOnly) {
    let wksp = this.getWorkspace();

    if (block) {
      block.select();
      let next = blockOnly ? block.getNextBlock() : null;
      if (next) {
        next.unplug(false); // setParent(null);
      }

      // separate child temporarily
      document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 67, ctrlKey: true }));
      if (next || blockOnly === 2) {
        setTimeout(() => {
          if (next) {
            wksp.undo(); // undo the unplug above...
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

    if (this.floatInp && !e.target.closest("#s3devIDDOut")) {
      if (
        !e.shiftKey ||
        // Clicking on the code area should always make multi-inject work
        (!document.getElementsByClassName("injectionDiv")[0].contains(e.target) &&
          // Focused inputs are not part of the injectionDiv, but to the user they are part of the code area so make multi-inject work there
          !e.target.classList.contains("blocklyHtmlInput")) ||
        // This selector targets workspace buttons (Make a Block etc.) and the extension (!) buttons, which most commonly trigger a popup window so always close the dropdown
        e.target.matches(".blocklyFlyoutButton, .blocklyFlyoutButton *, .blocklyTouchTargetBackground")
      ) {
        // If we click outside the dropdown, then instigate the hide code...
        this.hideFloatDropDown();
      }
    }

    if (e.button === 1 || e.shiftKey) {
      // Wheel button...
      try {
        this.middleClick(e);
      } catch (x) {
        console.error(x);
      }
    }
  }

  eventMouseUp(e) {
    this.updateMousePosition(e);

    if (e.button === 1 && e.target.closest("svg.blocklySvg")) {
      // On Linux systems, middle click is often treated as a paste.
      // We do not want this as we assign our own functionality to middle mouse.
      e.preventDefault();
    }
  }

  middleClickWorkspace(e) {
    if (!this.isScriptEditor()) {
      return;
    }

    // todo: if (!this.addon.settings.get("enableBlockInjector")) {
    //         return;
    //       }

    e.cancelBubble = true;
    e.preventDefault();

    let floatBar = document.getElementById("s3devFloatingBar");
    if (floatBar) {
      floatBar.remove();
    }

    // Popup new input box for block injection
    document.body.insertAdjacentHTML(
      "beforeend",
      `
            <div id="s3devFloatingBar" dir="${this.addon.tab.direction}">
                <label class='title s3devLabel' id=s3devInsertLabel>
                    <span style="display:none;">${this.m("insert")} </span>
                    <span id=s3devInsert class="s3devWrap">
                        <div id='s3devIDDOut' class="s3devDDOut">
                            <input id='s3devIInp' class="${this.addon.tab.scratchClass("input_input-form", {
                              others: "s3devInp",
                            })}" type='search' placeholder='${this.m("start-typing")}' autocomplete='off'>
                            <ul id='s3devIDD' class="s3devDD"></ul>
                        </div>
                    </span>
                </label>
            </div>
        `
    );

    floatBar = document.getElementById("s3devFloatingBar");
    floatBar.style.left = this.mouseXY.x + 16 + "px";
    floatBar.style.top = this.mouseXY.y - 8 + "px";

    this.floatInp = document.getElementById("s3devIInp");
    this.floatInp.focus();

    // Build Filter List...

    this.buildFloatingFilterList(e, floatBar);

    const ddOut = document.getElementById("s3devIDDOut");
    ddOut.addEventListener("mousedown", (...e) => this.dropDownFloatClick(...e));

    this.floatInp.addEventListener("keyup", (...e) => this.floatInputChange(...e));
    this.floatInp.addEventListener("focus", (...e) => this.floatInputChange(...e));
    this.floatInp.addEventListener("keydown", (...e) => this.floatInputKeyDown(...e));
  }

  middleClick(e) {
    // Intercept clicks to allow jump to...?
    let blockSvg = e.target.closest("[data-id]");
    if (!blockSvg) {
      // Ok, so no selection... are we at least clicking on the workspace?
      if (e.target.closest("svg.blocklySvg")) {
        this.blockCursor = null; // Clear the cursor if using the mouse
        this.middleClickWorkspace(e);
      }
    }
  }

  getEdgeTypeClass(block) {
    switch (block.edgeShape_) {
      case 1:
        return "boolean";
      case 2:
        return "reporter";
      default:
        return block.startHat_ ? "hat" : "block";
    }
  }

  buildFloatingFilterList(e, floatBar) {
    // todo: Iterate through the toolbox?

    let options = [];

    let t = this.getWorkspace().getToolbox();

    let blocks = t.flyout_.getWorkspace().getTopBlocks();
    // 107 blocks, not in order... but we can sort by y value or description right :)

    let fullDom = Blockly.Xml.workspaceToDom(t.flyout_.getWorkspace());
    const doms = {};
    for (const x of fullDom.children) {
      if (x.tagName === "BLOCK") {
        // let type = x.getAttribute('type');
        let id = x.getAttribute("id");
        doms[id] = x;
      }
    }

    for (const block of blocks) {
      this.getBlockText(block, options, doms);
    }

    // Griffpatch - on second thoughts - lets sort blocks by length so that shortest ones appear at the top.
    options.sort((a, b) =>
      a.desc.length < b.desc.length ? -1 : a.desc.length > b.desc.length ? 1 : a.desc.localeCompare(b.desc)
    );

    // Previous sort was just alphabetical
    // options.sort((a, b) => a.desc.localeCompare(b.desc));

    const dd = document.getElementById("s3devIDD");

    let count = 0;
    //DROPDOWN_BLOCK_LIST_MAX_ROWS

    for (const option of options) {
      const li = document.createElement("li");
      const desc = option.desc;

      // bType = hat block reporter boolean

      let bType = this.getEdgeTypeClass(option.block);

      count++;

      li.innerText = desc;
      li.data = { text: desc, lower: " " + desc.toLowerCase(), option: option };
      li.className =
        "var " + (option.block.isScratchExtension ? "extension" : option.block.getCategory()) + " " + bType; // proc.cls;
      if (count > DROPDOWN_BLOCK_LIST_MAX_ROWS) {
        // Limit maximum number of rows to prevent lag when no filter is applied
        li.style.display = "none";
      }
      dd.appendChild(li);
    }

    const ddOut = document.getElementById("s3devIDDOut");
    ddOut.classList.add("vis");

    // console.log(options);
  }

  /**
   * Flesh out a blocks description - duplicate up blocks with contained picklists (like list drop downs)
   * @param block
   * @param options
   * @param doms
   * @returns {string}
   */
  getBlockText(block, options, doms) {
    // block.type;  "looks_nextbackdrop"

    let desc;
    let picklist, pickField;

    let dom = doms[block.id];

    // dom = doms[block.type];

    const process = (block) => {
      for (const input of block.inputList) {
        // input.name = "", input.type = 5
        let fields = input.fieldRow;
        for (const field of fields) {
          // field --- Blockly.FieldLabel .className = "blocklyText"
          // Blockly.FieldDropdown --- .className = "blocklyText blocklyDropdownText"

          let text;

          if (!picklist && field.className_ === "blocklyText blocklyDropdownText") {
            picklist = field.getOptions();
            pickField = field.name;
            if (picklist && picklist.length > 0) {
              text = "^^";
            } else {
              text = field.getText();
            }
          } else {
            text = field.getText();
          }

          desc = (desc ? desc + " " : "") + text;
        }

        if (input.connection) {
          let innerBlock = input.connection.targetBlock();
          if (innerBlock) {
            process(innerBlock); // Recursive process connected child blocks...
          }
        }
      }
    };

    process(block);

    if (picklist) {
      for (const item of picklist) {
        let code = item[1];
        if (
          typeof code !== "string" || // Audio Record is a function!
          code === "DELETE_VARIABLE_ID" ||
          code === "RENAME_VARIABLE_ID" ||
          code === "NEW_BROADCAST_MESSAGE_ID" ||
          code === "NEW_BROADCAST_MESSAGE_ID" ||
          // editor-searchable-dropdowns compatibility
          code === "createGlobalVariable" ||
          code === "createLocalVariable" ||
          code === "createGlobalList" ||
          code === "createLocalList" ||
          code === "createBroadcast"
        ) {
          continue; // Skip these
        }
        options.push({
          desc: desc.replace("^^", item[0]),
          block: block,
          dom: dom,
          option: item,
          pickField: pickField,
        });
      }
    } else {
      options.push({ desc: desc, block: block, dom: dom });
    }

    return desc;
  }

  floatInputKeyDown(e) {
    if (e.keyCode === 38) {
      this.navigateFloatFilter(-1);
      e.preventDefault();
      return;
    }
    if (e.keyCode === 40) {
      this.navigateFloatFilter(1);
      e.preventDefault();
      return;
    }
    if (e.keyCode === 13) {
      // Enter
      let dd = document.getElementById("s3devIDD");
      let sel = dd.querySelector(".sel");
      if (sel) {
        this.dropDownFloatClick(e);
      }
      e.cancelBubble = true;
      e.preventDefault();
      return;
    }
    if (e.keyCode === 27) {
      // Escape
      let findInp = document.getElementById("s3devIInp");
      if (findInp.value.length > 0) {
        findInp.value = ""; // Clear search first, then close on second press
        this.floatInputChange(e);
      } else {
        this.reallyHideFloatDropDown(true);
      }
      e.preventDefault();
      return;
    }
  }

  navigateFloatFilter(dir) {
    let dd = document.getElementById("s3devIDD");
    let sel = dd.getElementsByClassName("sel");
    let nxt;
    if (sel.length > 0 && sel[0].style.display !== "none") {
      nxt = dir === -1 ? sel[0].previousSibling : sel[sel.length - 1].nextSibling;
    } else {
      nxt = dd.children[0];
      dir = 1;
    }
    while (nxt && nxt.style.display === "none") {
      nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
    }
    if (nxt) {
      for (const i of sel) {
        i.classList.remove("sel");
      }
      nxt.classList.add("sel");
      // centerTop(nxt.data.labelID);
    }
  }

  /**
   * This is a feature in progress - can we have a virtual cursor that allows the next injected element position be automated
   * @param block a blockly block
   * @param typ type
   */
  findNextHole(block, typ) {
    /*
      const inputs = block.inputList;
      if (inputs) {
        /!** Blockly.Input *!/
        for (const input of inputs) {
          const fieldRow = input.fieldRow;
          if (fieldRow) {
            /!** Blockly.FieldNumber *!/
            for (const field of fieldRow) {
              if (field.argType_ && field.argType_.includes(typ)) {
              }
            }
          }
        }
      }
  */
  }

  /**
   * Inject the selected block into the script
   * @param e
   */
  dropDownFloatClick(e) {
    e.cancelBubble = true;
    if (!e.target.closest("input")) {
      e.preventDefault();
    }

    let wksp = this.getWorkspace();

    let sel = e && e.target;
    if (sel.tagName === "B") {
      sel = sel.parentNode;
    }

    if (e instanceof MouseEvent && sel.tagName !== "LI") {
      // Mouse clicks need to be on a block...
      return;
    }

    if (!sel || !sel.data) {
      let dd = document.getElementById("s3devIDD");
      sel = dd.querySelector(".sel");
    }

    if (!sel) {
      return;
    }

    const xml = new XML();
    let x = xml.xmlDoc.firstChild;
    let option = sel.data.option;
    // block:option.block, dom:option.dom, option:option.option
    if (option.option) {
      // We need to tweak the dropdown in this xml...
      let field = option.dom.querySelector("field[name=" + option.pickField + "]");
      if (field.getAttribute("id")) {
        field.innerText = option.option[0];
        field.setAttribute("id", option.option[1] + "-" + option.option[0]);
      } else {
        field.innerText = option.option[1]; // griffpatch - oops! option.option[1] not 0?
      }

      // Handle "stop other scripts in sprite"
      if (option.option[1] === "other scripts in sprite") {
        option.dom.querySelector("mutation").setAttribute("hasnext", "true");
      }
    }

    x.appendChild(option.dom);

    let ids = Blockly.Xml.domToWorkspace(x, wksp);

    if (!e.shiftKey) {
      this.reallyHideFloatDropDown(true);
    }

    let block = wksp.getBlockById(ids[0]);

    if (this.blockCursor) {
      // What sort of block did we just inject?
      let typ = this.getEdgeTypeClass(option.block);
      if (typ === "boolean") {
        this.findNextHole(this.blockCursor, "");
      } else if (typ === "reporter") {
        this.findNextHole(this.blockCursor, typ);
      }
    }

    this.domHelpers.triggerDragAndDrop(block.svgPath_, null, { x: this.mouseXY.x, y: this.mouseXY.y }, e.shiftKey);

    if (e.shiftKey) {
      document.getElementById("s3devIInp").focus();
    }

    this.blockCursor = block;
  }

  floatInputChange(e) {
    let findInp = document.getElementById("s3devIInp");

    // Filter the list...
    let val = (findInp.value || "").toLowerCase();
    if (val === prevVal) {
      return;
    }

    prevVal = val;

    let dd = document.getElementById("s3devIDD");
    let p = dd.parentNode;
    dd.remove();

    let count = 0;

    let split = val.split(" ");
    let listLI = dd.getElementsByTagName("li");
    for (const li of listLI) {
      const procCode = li.data.text;
      const lower = li.data.lower;
      // let i = li.data.lower.indexOf(val);
      // let array = regExp.exec(li.data.lower);

      let im = 0;
      let match = [];
      for (let si = 0; si < split.length; si++) {
        let find = " " + split[si];
        let idx = lower.indexOf(find, im);
        if (idx === -1) {
          match = null;
          break;
        }
        match.push(idx);
        im = idx + find.length;
      }

      if (count < DROPDOWN_BLOCK_LIST_MAX_ROWS && match) {
        li.style.display = "block";
        this.dom_removeChildren(li);

        let i = 0;

        for (let iM = 0; iM < match.length; iM++) {
          let im = match[iM];
          if (im > i) {
            li.appendChild(document.createTextNode(procCode.substring(i, im)));
            i = im;
          }
          let bText = document.createElement("b");
          let len = split[iM].length;
          bText.appendChild(document.createTextNode(procCode.substr(i, len)));
          li.appendChild(bText);
          i += len;
        }

        if (i < procCode.length) {
          li.appendChild(document.createTextNode(procCode.substr(i)));
        }

        if (count === 0) {
          li.classList.add("sel");
        } else {
          li.classList.remove("sel");
        }
        count++;
      } else {
        li.style.display = "none";
        li.classList.remove("sel");
      }
    }
    p.append(dd);
  }

  initInner(root) {
    let guiTabs = root.childNodes;

    if (this.codeTab && guiTabs[0] !== this.codeTab) {
      // We have been CHANGED!!! - Happens when going to project page, and then back inside again!!!
      this.domHelpers.unbindAllEvents();
    }

    this.codeTab = guiTabs[0];
    this.costTab = guiTabs[1];
    this.costTabBody = document.querySelector("div[aria-labelledby=" + this.costTab.id + "]");

    this.domHelpers.bindOnce(document, "keydown", (...e) => this.eventKeyDown(...e), true);
    this.domHelpers.bindOnce(document, "mousemove", (...e) => this.eventMouseMove(...e), true);
    this.domHelpers.bindOnce(document, "mousedown", (...e) => this.eventMouseDown(...e), true); // true to capture all mouse downs 'before' the dom events handle them
    this.domHelpers.bindOnce(document, "mouseup", (...e) => this.eventMouseUp(...e), true);
  }
}

class Col {
  /**
   * @param x {Number} x position (for ordering)
   * @param count {Number}
   * @param blocks {[Block]}
   */
  constructor(x, count, blocks) {
    /**
     * x position (for ordering)
     * @type {Number}
     */
    this.x = x;
    /**
     * @type {Number}
     */
    this.count = count;
    /**
     * @type {[Blockly.Block]}
     */
    this.blocks = blocks;
  }
}

const DROPDOWN_BLOCK_LIST_MAX_ROWS = 25;

let rhdd2 = 0;
let prevVal = "";
