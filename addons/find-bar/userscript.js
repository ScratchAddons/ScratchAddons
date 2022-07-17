import BlockItem from "./blockly/BlockItem.js";
import BlockInstance from "./blockly/BlockInstance.js";
import Utils from "./blockly/Utils.js";

export default async function ({ addon, msg, console }) {
  class FindBar {
    constructor(root) {
      this.utils = new Utils(addon);
      this.workspace = this.utils.getWorkspace();

      this.prevValue = "";

      this.findLabel = null;
      this.findWrapper = null;
      this.findInput = null;
      this.dropdownOut = null;
      this.dropdown = new Dropdown(this.utils);
      this.carousel = null;

      this.createDom(root);
      this.bindEvents();
    }

    createDom(root) {
      const findBar = root.appendChild(document.createElement("div"));
      findBar.className = "find-bar";
      addon.tab.displayNoneWhileDisabled(findBar, { display: "flex" });

      this.findLabel = findBar.appendChild(document.createElement("label"));
      this.findLabel.htmlFor = "find-input";
      this.findLabel.textContent = msg("find");

      this.findWrapper = findBar.appendChild(document.createElement("span"));
      this.findWrapper.className = "find-wrapper";

      this.dropdownOut = this.findWrapper.appendChild(document.createElement("label"));
      this.dropdownOut.className = "find-dropdown-out";

      this.findInput = this.dropdownOut.appendChild(document.createElement("input"));
      this.findInput.className = addon.tab.scratchClass("input_input-form", {
        others: "find-input",
      });
      this.findInput.type = "search";
      this.findInput.placeholder = msg("find-placeholder");
      this.findInput.autocomplete = "off";

      this.dropdownOut.appendChild(this.dropdown.createDom());
    }

    bindEvents() {
      this.findInput.addEventListener("focus", () => this.inputChange());
      this.findInput.addEventListener("keydown", (e) => this.inputKeyDown(e));
      this.findInput.addEventListener("keyup", () => this.inputChange());
      this.findInput.addEventListener("focusout", () => this.hideDropDown());

      document.addEventListener("mousedown", (e) => this.eventMouseDown(e), true);
      document.addEventListener("keydown", (e) => this.eventKeyDown(e), true);
    }

    inputChange() {
      this.showDropDown();

      // Filter the list...
      let val = (this.findInput.value || "").toLowerCase();
      if (val === this.prevValue) {
        // No change so don't re-filter
        return;
      }
      this.prevValue = val;

      this.dropdown.multi.blocks = null;

      // Hide items in list that do not contain filter text
      let listLI = this.dropdown.items;
      for (const li of listLI) {
        let procCode = li.data.procCode;
        let i = li.data.lower.indexOf(val);
        if (i >= 0) {
          li.style.display = "block";
          this.dom_removeChildren(li);
          if (i > 0) {
            li.appendChild(document.createTextNode(procCode.substring(0, i)));
          }
          let bText = document.createElement("b");
          bText.appendChild(document.createTextNode(procCode.substr(i, val.length)));
          li.appendChild(bText);
          if (i + val.length < procCode.length) {
            li.appendChild(document.createTextNode(procCode.substr(i + val.length)));
          }
        } else {
          li.style.display = "none";
        }
      }
    }

    inputKeyDown(e) {
      this.dropdown.inputKeyDown(e);

      // Enter
      if (e.keyCode === 13) {
        this.findInput.blur();
        return;
      }

      // Escape
      if (e.keyCode === 27) {
        if (this.findInput.value.length > 0) {
          this.findInput.value = ""; // Clear search first, then close on second press
          this.inputChange();
        } else {
          // noinspection JSUnresolvedFunction
          this.findInput.blur();
        }
        e.preventDefault();
        return;
      }
    }

    showDropDown(focusID, instanceBlock) {
      if (!focusID && this.dropdownOut.classList.contains("visible")) {
        return;
      }

      // special '' vs null... - null forces a reevaluation
      this.prevValue = focusID ? "" : null; // Clear the previous value of the input search

      this.dropdownOut.classList.add("visible");
      let scratchBlocks =
        this.selectedTab === 1
          ? this.getScratchCostumes()
          : this.selectedTab === 0
          ? this.getScratchBlocks()
          : this.getScratchSounds();

      this.dropdown.empty();

      let foundLi = null;
      /**
       * @type {[BlockItem]}
       */
      const procs = scratchBlocks.procs;
      for (const proc of procs) {
        let item = this.dropdown.addItem(proc);

        if (focusID) {
          if (proc.matchesID(focusID)) {
            foundLi = item;
            item.classList.add("sel");
            this.dropdown.selected = item;
          } else {
            item.style.display = "none";
          }
        }
      }

      this.utils.offsetX =
        this.dropdownOut.getBoundingClientRect().right - this.findLabel.getBoundingClientRect().left + 26;
      this.utils.offsetY = 32;

      if (foundLi) {
        this.dropdown.clickDropDownRow(foundLi, instanceBlock);
      }
    }

    hideDropDown() {
      this.dropdownOut.classList.remove("visible");
    }

    get selectedTab() {
      return addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
    }

    isBlockAnOrphan(topBlock) {
      return !!topBlock.outputConnection;
    }

    getOrderedTopBlockColumns(separateOrphans) {
      let topBlocks = this.workspace.getTopBlocks();
      let maxWidths = {};

      if (separateOrphans) {
        let topComments = this.workspace.getTopComments();

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
          cols.push({ x: position.x, count: 1, blocks: [topBlock] });
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

    getCallsToEvents() {
      const uses = []; // Definition First, then calls to it
      const found = {};

      let topBlocks = this.workspace.getTopBlocks();
      for (const topBlock of topBlocks) {
        /** @type {!Array<!Blockly.Block>} */
        let kids = topBlock.getDescendants();
        for (const block of kids) {
          if (block.type === "event_broadcast" || block.type === "event_broadcastandwait") {
            const eventName = block.getChildren()[0].inputList[0].fieldRow[0].getText();
            if (!found[eventName]) {
              found[eventName] = block;
              uses.push({ eventName: eventName, block: block });
            }
          }
        }
      }

      return uses;
    }

    getScratchBlocks() {
      let myBlocks = [];
      let myBlocksByProcCode = {};

      let topBlocks = this.workspace.getTopBlocks();

      /**
       * @param cls
       * @param txt
       * @param root
       * @returns BlockItem
       */
      function addBlock(cls, txt, root) {
        let id = root.id ? root.id : root.getId ? root.getId() : null;
        let clone = myBlocksByProcCode[txt];
        if (clone) {
          if (!clone.clones) {
            clone.clones = [];
          }
          clone.clones.push(id);
          return clone;
        }
        let items = new BlockItem(cls, txt, id, 0);
        items.y = root.getRelativeToSurfaceXY ? root.getRelativeToSurfaceXY().y : null;
        myBlocks.push(items);
        myBlocksByProcCode[txt] = items;
        return items;
      }

      function getDescFromField(root) {
        let fields = root.inputList[0];
        let desc;
        for (const fieldRow of fields.fieldRow) {
          desc = (desc ? desc + " " : "") + fieldRow.getText();
        }
        return desc;
      }

      for (const root of topBlocks) {
        if (root.type === "procedures_definition") {
          const label = root.getChildren()[0];
          const procCode = label.getProcCode();
          if (!procCode) {
            continue;
          }
          const indexOfLabel = root.inputList.findIndex((i) => i.fieldRow.length > 0);
          if (indexOfLabel === -1) {
            continue;
          }
          const translatedDefine = root.inputList[indexOfLabel].fieldRow[0].getText();
          const message = indexOfLabel === 0 ? `${translatedDefine} ${procCode}` : `${procCode} ${translatedDefine}`;
          addBlock("define", message, root);
          continue;
        }

        if (root.type === "event_whenflagclicked") {
          addBlock("flag", getDescFromField(root), root); // "When Flag Clicked"
          continue;
        }

        if (root.type === "event_whenbroadcastreceived") {
          try {
            // let wksp2 = Blockly.getMainWorkspace().getTopBlocks()[2].inputList[0].fieldRow[1];
            let fields = root.inputList[0];
            // let typeDesc = fields.fieldRow[0].getText();
            let eventName = fields.fieldRow[1].getText();
            // addBlock('receive', typeDesc + ' ' + eventName, root).eventName = eventName;
            addBlock("receive", "event " + eventName, root).eventName = eventName;
          } catch (e) {
            // eat
          }
          continue;
        }

        if (root.type.substr(0, 10) === "event_when") {
          addBlock("event", getDescFromField(root), root); // "When Flag Clicked"
          continue;
        }

        if (root.type === "control_start_as_clone") {
          addBlock("event", getDescFromField(root), root); // "when I start as a clone"
          continue;
        }
      }

      let map = this.workspace.getVariableMap();

      let vars = map.getVariablesOfType("");
      for (const row of vars) {
        addBlock(row.isLocal ? "var" : "VAR", (row.isLocal ? "var " : "VAR ") + row.name, row);
      }

      let lists = map.getVariablesOfType("list");
      for (const row of lists) {
        addBlock(row.isLocal ? "list" : "LIST", (row.isLocal ? "list " : "LIST ") + row.name, row);
      }

      const events = this.getCallsToEvents();
      for (const event of events) {
        addBlock("receive", "event " + event.eventName, event.block).eventName = event.eventName;
      }

      const clsOrder = { flag: 0, receive: 1, event: 2, define: 3, var: 4, VAR: 5, list: 6, LIST: 7 };

      myBlocks.sort((a, b) => {
        let t = clsOrder[a.cls] - clsOrder[b.cls];
        if (t !== 0) {
          return t;
        }
        if (a.lower < b.lower) {
          return -1;
        }
        if (a.lower > b.lower) {
          return 1;
        }
        return a.y - b.y;
      });

      return { procs: myBlocks };
    }

    getScratchCostumes() {
      let costumes = this.utils.getEditingTarget().getCostumes();

      let procs = [];

      let i = 0;
      for (const costume of costumes) {
        let items = new BlockItem("costume", costume.name, costume.assetId, i);
        procs.push(items);
        i++;
      }

      return { procs };
    }

    getScratchSounds() {
      let sounds = this.utils.getEditingTarget().getSounds();

      let procs = [];

      let i = 0;
      for (const sound of sounds) {
        let items = new BlockItem("sound", sound.name, sound.assetId, i);
        procs.push(items);
        i++;
      }

      return { procs };
    }

    dom_removeChildren(myNode) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }

    eventMouseDown(e) {
      if (addon.self.disabled) return;

      if (this.dropdownOut && this.dropdownOut.classList.contains("visible") && !e.target.closest(".visible")) {
        // If we click outside the dropdown, then instigate the hide code...
        this.hideDropDown();
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

    eventKeyDown(e) {
      if (addon.self.disabled) return;

      let ctrlKey = e.ctrlKey || e.metaKey;

      if (e.key === "f" && ctrlKey && !e.shiftKey) {
        // Ctrl + F (Override default Ctrl+F find)
        this.findInput.focus();
        this.findInput.select();
        e.cancelBubble = true;
        e.preventDefault();
        return true;
      }

      if (e.keyCode === 37 && ctrlKey) {
        // Ctrl + Left Arrow Key
        if (document.activeElement.tagName === "INPUT") {
          return;
        }

        if (this.selectedTab === 0) {
          this.utils.navigationHistory.goBack();
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

        if (this.selectedTab === 0) {
          this.utils.navigationHistory.goForward();
          e.cancelBubble = true;
          e.preventDefault();
          return true;
        }
      }
    }
    middleClick(e) {
      // Intercept clicks to allow jump to...?
      let blockSvg = e.target.closest("[data-id]");
      if (!blockSvg) {
        return;
      }

      let w = this.workspace;
      let dataId = blockSvg.getAttribute("data-id");
      let block = w.getBlockById(dataId);
      if (!block) {
        return;
      }

      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_definition") {
          let id = block.id ? block.id : block.getId ? block.getId() : null;

          this.findInput.focus();
          this.showDropDown(id);

          e.cancelBubble = true;
          e.preventDefault();
          return;
        }

        if (
          block.type === "data_variable" ||
          block.type === "data_changevariableby" ||
          block.type === "data_setvariableto"
        ) {
          let id = block.getVars()[0];

          this.findInput.focus();
          this.showDropDown(id, block);

          // let button = document.getElementById('s3devReplace');

          this.selVarID = id;
          // button.classList.remove('s3devHide');

          e.cancelBubble = true;
          e.preventDefault();
          return;
        }

        if (
          block.type === "event_whenbroadcastreceived" ||
          block.type === "event_broadcastandwait" ||
          block.type === "event_broadcast"
        ) {
          // todo: actually index the broadcasts...!
          let id = block.id;

          this.findInput.focus();
          this.showDropDown(id, block);

          this.selVarID = id;

          e.cancelBubble = true;
          e.preventDefault();
          return;
        }
      }

      e.cancelBubble = true;
      e.preventDefault();
    }
  }

  class Dropdown {
    constructor(utils) {
      this.utils = utils;
      this.workspace = this.utils.getWorkspace();
      this.multi = new Multi(this.utils);

      this.el = null;
      this.items = [];
      this.selected = null;
    }

    createDom() {
      this.el = document.createElement("ul");
      this.el.className = "find-dropdown";
      return this.el;
    }

    inputKeyDown(e) {
      // Up Arrow
      if (e.keyCode === 38) {
        this.navigateFilter(-1);
        e.preventDefault();
        return;
      }

      // Down Arrow
      if (e.keyCode === 40) {
        this.navigateFilter(1);
        e.preventDefault();
        return;
      }

      // Left Arrow
      if (e.keyCode === 37) {
        if (this.selected && this.multi.blocks) {
          this.multi.navLeft(e);
        }
      }

      // Right Arrow
      if (e.keyCode === 39) {
        if (this.selected && this.multi.blocks) {
          this.multi.navRight(e);
        }
      }

      // Enter
      if (e.keyCode === 13) {
        // Any selected on enter? if not select now
        if (this.selected) {
          this.navigateFilter(1);
        }
        e.preventDefault();
        return;
      }
    }

    navigateFilter(dir) {
      let nxt;
      if (this.selected && this.selected.style.display !== "none") {
        nxt = dir === -1 ? this.selected.previousSibling : this.selected.nextSibling;
      } else {
        nxt = this.items[0];
        dir = 1;
      }
      while (nxt && nxt.style.display === "none") {
        nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
      }
      if (nxt) {
        this.onItemClick(nxt);
      }
    }

    addItem(proc) {
      const item = document.createElement("li");
      item.innerText = proc.procCode;
      item.data = proc;
      item.className = proc.cls;
      item.addEventListener("mousedown", (e) => {
        this.onItemClick(item);
        e.preventDefault();
        e.cancelBubble = true;
        return false;
      });
      this.items.push(item);
      this.el.appendChild(item);
      return item;
    }

    onItemClick(item) {
      if (this.selected && this.selected !== item) {
        this.selected.classList.remove("sel");
        this.selected = null;
      }
      if (this.selected !== item) {
        item.classList.add("sel");
        this.selected = item;
      }

      this.clickDropDownRow(item);
    }

    clickDropDownRow(item, instanceBlock) {
      let cls = item.data.cls;
      if (cls === "costume" || cls === "sound") {
        // Viewing costumes/sounds - jump to selected costume/sound
        const assetPanel = document.querySelector("[class^=asset-panel_wrapper]");
        if (assetPanel) {
          const reactInstance = assetPanel[addon.tab.traps.getInternalKey(assetPanel)];
          const reactProps = reactInstance.pendingProps.children[0].props;
          reactProps.onItemClick(item.data.y);
          const selectorList = assetPanel.firstChild.firstChild;
          selectorList.children[item.data.y].scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "start",
          });
          // The wrapper seems to scroll when we use the function above.
          let wrapper = assetPanel.closest("div[class*=gui_flex-wrapper]");
          wrapper.scrollTop = 0;
        }
      } else if (cls === "var" || cls === "VAR" || cls === "list" || cls === "LIST") {
        // Search now for all instances
        let blocks = this.getVariableUsesById(item.data.labelID);
        this.buildNavigationCarousel(item, blocks, instanceBlock);
      } else if (cls === "define") {
        let blocks = this.getCallsToProcedureById(item.data.labelID);
        this.buildNavigationCarousel(item, blocks, instanceBlock);
      } else if (cls === "receive") {
        /*
          let blocks = [this.workspace.getBlockById(li.data.labelID)];
          if (li.data.clones) {
              for (const cloneID of li.data.clones) {
                  blocks.push(this.workspace.getBlockById(cloneID))
              }
          }
          blocks = blocks.concat(getCallsToEventsByName(li.data.eventName));
        */
        // Now, fetch the events from the scratch runtime instead of blockly
        let blocks = this.getCallsToEventsByName(item.data.eventName);
        if (!instanceBlock) {
          // Can we start by selecting the first block on 'this' sprite
          const currentTargetID = this.utils.getEditingTarget().id;
          for (const block of blocks) {
            if (block.targetId === currentTargetID) {
              instanceBlock = block;
              break;
            }
          }
        }
        this.buildNavigationCarousel(item, blocks, instanceBlock);
      } else if (item.data.clones) {
        let blocks = [this.workspace.getBlockById(item.data.labelID)];
        for (const cloneID of item.data.clones) {
          blocks.push(this.workspace.getBlockById(cloneID));
        }
        this.buildNavigationCarousel(item, blocks, instanceBlock);
      } else {
        this.multi.blocks = null;
        this.utils.scrollBlockIntoView(item.data.labelID);
        if (this.carousel) {
          this.carousel.remove();
        }
      }
    }

    getVariableUsesById(id) {
      let uses = [];

      let topBlocks = this.workspace.getTopBlocks();
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

    getCallsToProcedureById(id) {
      let procBlock = this.workspace.getBlockById(id);
      let label = procBlock.getChildren()[0];
      let procCode = label.getProcCode();

      let uses = [procBlock]; // Definition First, then calls to it
      let topBlocks = this.workspace.getTopBlocks();
      for (const topBlock of topBlocks) {
        /** @type {!Array<!Blockly.Block>} */
        let kids = topBlock.getDescendants();
        for (const block of kids) {
          if (block.type === "procedures_call") {
            if (block.getProcCode() === procCode) {
              uses.push(block);
            }
          }
        }
      }

      return uses;
    }

    getCallsToEventsByName(name) {
      let uses = []; // Definition First, then calls to it

      const runtime = addon.tab.traps.vm.runtime;
      const targets = runtime.targets; // The sprites / stage

      for (const target of targets) {
        if (!target.isOriginal) {
          continue; // Skip clones
        }

        const blocks = target.blocks;
        if (!blocks._blocks) {
          continue;
        }

        for (const id of Object.keys(blocks._blocks)) {
          const block = blocks._blocks[id];
          // To find event broadcaster blocks, we look for the nested "event_broadcast_menu" blocks first that match the event name
          if (block.opcode === "event_broadcast_menu" && block.fields.BROADCAST_OPTION.value === name) {
            // Now get the parent block that is the actual broadcast or broadcast and wait
            const broadcastBlock = blocks.getBlock(block.parent);
            uses.push(new BlockInstance(target, broadcastBlock));
          } else if (block.opcode === "event_whenbroadcastreceived" && block.fields.BROADCAST_OPTION.value === name) {
            uses.push(new BlockInstance(target, block));
          }
        }
      }

      return uses;
    }

    buildNavigationCarousel(li, blocks, instanceBlock) {
      if (this.carousel && this.carousel.parentNode === li) {
        // Same control... click again to go to next
        this.multi.navRight();
      } else {
        if (this.carousel) {
          this.carousel.remove();
        }
        this.carousel = li.appendChild(document.createElement("span"));
        this.carousel.className = "find-carousel";

        const leftControl = this.carousel.appendChild(document.createElement("span"));
        leftControl.className = "find-carousel-control";
        leftControl.textContent = "◀";
        leftControl.addEventListener("mousedown", (e) => this.multi.navLeft(e));

        const count = this.carousel.appendChild(document.createElement("span"));
        this.multi.count = count;

        const rightControl = this.carousel.appendChild(document.createElement("span"));
        rightControl.className = "find-carousel-control";
        rightControl.textContent = "▶";
        rightControl.addEventListener("mousedown", (e) => this.multi.navRight(e));

        this.multi.idx = 0;

        if (instanceBlock) {
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.id === instanceBlock.id) {
              this.multi.idx = i;
              break;
            }
          }
          // multi.idx = blocks.indexOf(instanceBlock);
        }

        this.multi.blocks = blocks;
        this.multi.update();

        if (this.multi.idx < blocks.length) {
          this.utils.scrollBlockIntoView(blocks[this.multi.idx]);
        }
      }
    }

    empty() {
      for (const item of this.items) {
        this.el.removeChild(item);
      }
      this.items = [];
      this.selected = null;
    }
  }

  while (true) {
    const root = await addon.tab.waitForElement("ul[class*=gui_tab-list_]", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    new FindBar(root);
  }
}

class Multi {
  constructor(utils) {
    this.idx = 0;
    this.count = null;
    this.blocks = null;
    this.selID = null;
    /**
     * @type {Utils}
     */
    this.utils = utils;
  }

  update() {
    this.count.innerText = this.blocks && this.blocks.length > 0 ? this.idx + 1 + " / " + this.blocks.length : "0";
    this.selID = this.idx < this.blocks.length ? this.blocks[this.idx].id : null;
  }

  navLeft(e) {
    return this.navSideways(e, -1);
  }

  navRight(e) {
    return this.navSideways(e, 1);
  }

  navSideways(e, dir) {
    if (this.blocks && this.blocks.length > 0) {
      this.idx = (this.idx + dir + this.blocks.length) % this.blocks.length; // + length to fix negative modulo js issue.
      this.update();
      this.utils.scrollBlockIntoView(this.blocks[this.idx]);
    }
    if (e) {
      e.cancelBubble = true;
      e.preventDefault();
    }
    return false;
  }
}
