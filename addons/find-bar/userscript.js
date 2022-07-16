import BlockItem from "./blockly/BlockItem.js";
import BlockInstance from "./blockly/BlockInstance.js";
import Utils from "./blockly/Utils.js";

function enc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
    this.count.innerText = this.blocks && this.blocks.length > 0 ? enc(this.idx + 1 + " / " + this.blocks.length) : "0";
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

export default async function ({ addon, msg, global, console }) {
  class FindBar {
    constructor(root, workspace) {
      this.workspace = workspace;

      this.utils = new Utils(addon);
      this.multi = new Multi(this.utils);

      this.prevValue = "";
      this.rhdd = 0;

      this.findLabel = null;
      this.findWrapper = null;
      this.findInput = null;
      this.dropdownOut = null;
      this.dropdown = null;

      let guiTabs = root.childNodes;
      this.codeTab = guiTabs[0];
      this.costumeTab = guiTabs[1];

      this.costumeTabBody = document.querySelector("div[aria-labelledby=" + this.costumeTab.id + "]");

      this.createDom(root);
      this.bindEvents();
    }

    async createDom(root) {
      const findBar = root.appendChild(document.createElement("div"));
      findBar.className = "find-bar";

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

      this.dropdown = this.dropdownOut.appendChild(document.createElement("ul"));
      this.dropdown.className = "find-dropdown";
    }

    bindEvents() {
      this.dropdownOut.addEventListener("mousedown", (e) => this.dropDownClick(e));

      this.findInput.addEventListener("keyup", (e) => this.inputChange());
      this.findInput.addEventListener("focus", (e) => this.inputChange());
      this.findInput.addEventListener("keydown", (e) => this.inputKeyDown(e));

      document.addEventListener("mousedown", (e) => this.eventMouseDown(e), true);
      document.addEventListener("keydown", (e) => this.eventKeyDown(e), true);
    }

    clickDropDownRow(li, workspace, instanceBlock) {
      let nav = document.querySelector(".find-carousel");

      let cls = li.data.cls;
      if (cls === "costume") {
        // Viewing costumes - jump to selected costume
        let costumes = this.costumeTabBody.querySelectorAll("div[class^='sprite-selector-item_sprite-name']");
        let costume = costumes[li.data.y];
        if (costume) {
          costume.click();
          setTimeout(() => {
            let wrapper = costume.closest("div[class*=gui_flex-wrapper]");
            costume.parentElement.parentElement.scrollIntoView({
              behavior: "auto",
              block: "center",
              inline: "start",
            });
            wrapper.scrollTop = 0;
          }, 10);
        }
      } else if (cls === "var" || cls === "VAR" || cls === "list" || cls === "LIST") {
        // Search now for all instances
        // let wksp = getWorkspace();
        // let blocks = wksp.getVariableUsesById(li.data.labelID);
        let blocks = this.getVariableUsesById(li.data.labelID);
        this.buildNavigationCarousel(nav, li, blocks, instanceBlock);
      } else if (cls === "define") {
        let blocks = this.getCallsToProcedureById(li.data.labelID);
        this.buildNavigationCarousel(nav, li, blocks, instanceBlock);
      } else if (cls === "receive") {
        /*
                            let blocks = [workspace.getBlockById(li.data.labelID)];
                            if (li.data.clones) {
                                for (const cloneID of li.data.clones) {
                                    blocks.push(workspace.getBlockById(cloneID))
                                }
                            }
                            blocks = blocks.concat(getCallsToEventsByName(li.data.eventName));
                */
        // Now, fetch the events from the scratch runtime instead of blockly
        let blocks = this.getCallsToEventsByName(li.data.eventName);
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
        this.buildNavigationCarousel(nav, li, blocks, instanceBlock);
      } else if (li.data.clones) {
        let blocks = [workspace.getBlockById(li.data.labelID)];
        for (const cloneID of li.data.clones) {
          blocks.push(workspace.getBlockById(cloneID));
        }
        this.buildNavigationCarousel(nav, li, blocks, instanceBlock);
      } else {
        this.multi.blocks = null;
        this.centerTop(li.data.labelID);
        if (nav) {
          nav.remove();
        }
      }
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

    getCallsToProcedureById(id) {
      let w = this.workspace;
      let procBlock = w.getBlockById(id);
      let label = procBlock.getChildren()[0];
      let procCode = label.getProcCode();

      let uses = [procBlock]; // Definition First, then calls to it
      let topBlocks = this.getTopBlocks(true);
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

    buildNavigationCarousel(nav, li, blocks, instanceBlock) {
      if (nav && nav.parentNode === li) {
        // Same control... click again to go to next
        this.multi.navRight();
      } else {
        if (nav) {
          nav.remove();
        }
        const carousel = li.appendChild(document.createElement("span"));
        carousel.className = "find-carousel";

        const leftControl = carousel.appendChild(document.createElement("span"));
        leftControl.className = "find-carousel-control";
        leftControl.textContent = "◀";
        leftControl.addEventListener("mousedown", (e) => this.multi.navLeft(e));

        const count = carousel.appendChild(document.createElement("span"));
        this.multi.count = count;

        const rightControl = carousel.appendChild(document.createElement("span"));
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
          this.centerTop(blocks[this.multi.idx]);
        }
      }
    }

    centerTop(e, force) {
      this.utils.scrollBlockIntoView(e, force);
    }

    dropDownClick(e) {
      let workspace = this.workspace;

      if (this.prevValue === null) {
        this.prevValue = this.findInput.value; // Hack to stop filter change if not entered data into edt box, but clicked on row
      }

      let li = e.target;
      while (true) {
        if (!li || li === this.dropdown) {
          return;
        }
        if (li.data) {
          break;
        }
        li = li.parentNode;
      }

      // If this was a mouse click, unselect the keyboard selection
      // e.navKey is set when this is called from the keyboard handler...
      if (!e.navKey) {
        let sel = this.dropdown.getElementsByClassName("sel");
        sel = sel.length > 0 ? sel[0] : null;
        if (sel && sel !== li) {
          try {
            sel.classList.remove("sel");
          } catch (e) {
            console.log(sel);
            console.error(e);
          }
        }
        if (li !== sel) {
          li.classList.add("sel");
        }
      }

      this.clickDropDownRow(li, workspace);
      if (e && e.preventDefault) {
        e.preventDefault();
        e.cancelBubble = true;
      }
      return false;
    }

    inputChange() {
      if (!this.dropdownOut.classList.contains("visible")) {
        this.showDropDown();
        this.hideDropDown(); // Start timer to hide if not got focus
      }

      // Filter the list...
      let val = (this.findInput.value || "").toLowerCase();
      if (val === this.prevVal) {
        // No change so don't re-filter
        return;
      }

      this.prevVal = val;
      this.multi.blocks = null;

      //
      // Hide items in list that do not contain filter text, and highlight the parts of words that match the filter text

      let listLI = this.dropdown.getElementsByTagName("li");
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
          // li.innerHTML = enc(procCode.substring(0, i)) + '<b>' + enc(procCode.substr(i, val.length)) + "</b>" + enc(procCode.substr(i + val.length));
        } else {
          li.style.display = "none";
        }
      }
    }

    get costumeEditor() {
      return this.costumeTab.className.indexOf("gui_is-selected") >= 0;
    }

    get scriptEditor() {
      return this.codeTab.className.indexOf("gui_is-selected") >= 0;
    }

    isBlockAnOrphan(topBlock) {
      return !!topBlock.outputConnection;
    }

    getOrderedTopBlockColumns(separateOrphans) {
      let w = this.workspace;
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

    getCallsToEvents() {
      const uses = []; // Definition First, then calls to it
      const found = {};

      let topBlocks = this.getTopBlocks();
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

      let wksp = this.workspace;
      let topBlocks = wksp.getTopBlocks();

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

      let map = wksp.getVariableMap();

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
      let costumes = this.costumeTabBody.querySelectorAll("div[class^='sprite-selector-item_sprite-name']");
      // this.costTab[0].click();

      let myBlocks = [];
      let myBlocksByProcCode = {};

      /**
       * @param cls
       * @param txt
       * @param root
       * @returns BlockItem
       */
      function addBlock(cls, txt, root) {
        let id = root.className;
        let items = new BlockItem(cls, txt, id, 0);
        myBlocks.push(items);
        myBlocksByProcCode[txt] = items;
        return items;
      }

      let i = 0;
      for (const costume of costumes) {
        addBlock("costume", costume.innerText, costume).y = i;
        i++;
      }

      return { procs: myBlocks };
    }

    dom_removeChildren(myNode) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }

    showDropDown(focusID, instanceBlock) {
      clearTimeout(this.rhdd);
      this.rhdd = 0;

      if (!focusID && this.dropdownOut.classList.contains("visible")) {
        return;
      }

      // special '' vs null... - null forces a reevaluation
      this.prevVal = focusID ? "" : null; // Clear the previous value of the input search

      this.dropdownOut.classList.add("visible");
      let scratchBlocks = this.costumeEditor ? this.getScratchCostumes() : this.getScratchBlocks();

      this.dom_removeChildren(this.dropdown);

      let foundLi = null;
      /**
       * @type {[BlockItem]}
       */
      const procs = scratchBlocks.procs;
      for (const proc of procs) {
        let li = document.createElement("li");
        li.innerText = proc.procCode;
        li.data = proc;
        li.className = proc.cls;
        if (focusID) {
          if (proc.matchesID(focusID)) {
            foundLi = li;
            li.classList.add("sel");
          } else {
            li.style.display = "none";
          }
        }
        this.dropdown.appendChild(li);
      }

      this.utils.offsetX =
        this.dropdownOut.getBoundingClientRect().right - this.findLabel.getBoundingClientRect().left + 26;
      this.utils.offsetY = 32;

      if (foundLi) {
        this.clickDropDownRow(foundLi, this.workspace, instanceBlock);
      }
    }

    hideDropDown() {
      clearTimeout(this.rhdd);
      this.rhdd = setTimeout(() => this.reallyHideDropDown(), 250);
    }

    reallyHideDropDown() {
      // Check focus of find box
      if (this.findInput === document.activeElement) {
        this.hideDropDown();
        return;
      }

      this.dropdownOut.classList.remove("visible");
      this.rhdd = 0;
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
        let sel = this.dropdown.getElementsByClassName("sel");
        if (sel && this.multi.blocks) {
          this.multi.navLeft(e);
        }
      }

      // Right Arrow
      if (e.keyCode === 39) {
        let sel = this.dropdown.getElementsByClassName("sel");
        if (sel && this.multi.blocks) {
          this.multi.navRight(e);
        }
      }

      // Enter
      if (e.keyCode === 13) {
        // Any selected on enter? if not select now
        let sel = this.dropdown.getElementsByClassName("sel");
        if (sel.length === 0) {
          this.navigateFilter(1);
        }
        // noinspection JSUnresolvedFunction
        document.activeElement.blur();
        e.preventDefault();
        return;
      }

      // Escape
      if (e.keyCode === 27) {
        if (this.findInput.value.length > 0) {
          this.findInput.value = ""; // Clear search first, then close on second press
          this.inputChange(e);
        } else {
          // noinspection JSUnresolvedFunction
          document.activeElement.blur();
        }
        e.preventDefault();
        return;
      }
    }

    navigateFilter(dir) {
      let sel = this.dropdown.getElementsByClassName("sel");
      let nxt;
      if (sel.length > 0 && sel[0].style.display !== "none") {
        nxt = dir === -1 ? sel[0].previousSibling : sel[sel.length - 1].nextSibling;
      } else {
        nxt = this.dropdown.children[0];
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
        this.dropDownClick({ target: nxt, navKey: true });
        // centerTop(nxt.data.labelID);
      }
    }

    getVariableUsesById(id) {
      let uses = [];

      let topBlocks = this.getTopBlocks(true);
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

    eventMouseDown(e) {
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

        if (this.scriptEditor) {
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

        if (this.scriptEditor) {
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

      // Move outwards until we reach a block we can take action on

      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_call") {
          e.cancelBubble = true;
          e.preventDefault();

          // todo: navigate to definition
          let findProcCode = block.getProcCode();

          let wksp = this.workspace;
          let topBlocks = wksp.getTopBlocks();
          for (const root of topBlocks) {
            if (root.type === "procedures_definition") {
              let label = root.getChildren()[0];
              let procCode = label.getProcCode();
              if (procCode && procCode === findProcCode) {
                // Found... navigate to it!
                this.centerTop(root);
                return;
              }
            }
          }
        }

        if (block.type === "procedures_definition") {
          let id = block.id ? block.id : block.getId ? block.getId() : null;

          this.findInput.focus();
          this.showDropDown(null, id);

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
          this.showDropDown(null, id, block);

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
          this.showDropDown(null, id, block);

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

  while (true) {
    const root = await addon.tab.waitForElement("ul[class*=gui_tab-list_]", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    const ScratchBlocks = await addon.tab.traps.getBlockly();
    new FindBar(root, ScratchBlocks.getMainWorkspace());
  }
}
