import WorkspaceQuerier from "./WorkspaceQuerier.js";
import renderBlock from "./BlockRenderer.js";

export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  let mouse = { x: 0, y: 0 };

  class FloatingInput {
    constructor() {
      this.floatBar = null;
      this.floatInput = null;
      this.dropdownOut = null;
      this.dropdown = null;

      this.prevVal = "";

      this.DROPDOWN_BLOCK_LIST_MAX_ROWS = 25;
      this.querier = new WorkspaceQuerier(Blockly, msg);

      this.createDom();
    }

    get workspace() {
      return Blockly.getMainWorkspace();
    }

    get selectedTab() {
      return addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
    }

    createDom() {
      // Popup new input box for block injection
      this.floatBar = document.body.appendChild(document.createElement("div"));
      this.floatBar.className = "sa-float-bar";
      this.floatBar.dir = addon.tab.direction;
      this.floatBar.style.display = "none";

      this.dropdownOut = this.floatBar.appendChild(document.createElement("div"));
      this.dropdownOut.className = "sa-float-bar-dropdown-out";

      this.floatInputWrapper = this.dropdownOut.appendChild(document.createElement("div"));
      this.floatInputWrapper.className = addon.tab.scratchClass("input_input-form", {
        others: "sa-float-bar-input-wrapper",
      });

      this.floatInput = this.floatInputWrapper.appendChild(document.createElement("span"));
      this.floatInput.contentEditable = true;
      this.floatInput.className = "sa-float-bar-input";

      this.floatInputSuggestion = this.floatInputWrapper.appendChild(document.createElement("span"));
      this.floatInputSuggestion.contentEditable = false;
      this.floatInputSuggestion.className = "sa-float-bar-input-suggestion";

      this.dropdown = this.dropdownOut.appendChild(document.createElement("div"));
      this.dropdown.className = "sa-float-bar-dropdown";

      this.testSvg = this.dropdown.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
      this.testSvg.setAttribute("width", "100%");
      this.testSvg.setAttribute("height", "400px");
      this.testSvg.setAttribute("viewBox", "0 25");

      this.floatInput.addEventListener("input", () => this.inputChange());
      this.floatInput.addEventListener("keydown", (...e) => this.inputKeyDown(...e));
      this.floatInput.addEventListener("focus", () => this.inputChange());
      this.floatInput.addEventListener("focusout", () => this.hide());

      this.dropdownOut.addEventListener("mousedown", (...e) => this.onClick(...e));

      document.addEventListener("keydown", (e) => {
        let ctrlKey = e.ctrlKey || e.metaKey;

        if (e.key === " " && ctrlKey) {
          // Ctrl + Space (Inject Code)
          this.show(e);
          e.cancelBubble = true;
          e.preventDefault();
          return true;
        }
      });
    }

    show(e) {
      if (this.selectedTab !== 0) {
        return;
      }

      e.cancelBubble = true;
      e.preventDefault();

      this.querier.indexWorkspace(this.workspace);

      this.floatBar.style.left = (e.clientX ?? mouse.x) + 16 + "px";
      this.floatBar.style.top = (e.clientY ?? mouse.y) - 8 + "px";
      this.floatBar.style.display = "";
      this.floatInput.innerText = "";
      this.floatInput.focus();
    }

    onClick(e) {
      e.cancelBubble = true;
      if (!e.target.closest("input")) {
        e.preventDefault();
      }

      let sel = e && e.target;
      if (sel.tagName === "B") {
        sel = sel.parentNode;
      }

      if (e instanceof MouseEvent && sel.tagName !== "LI") {
        // Mouse clicks need to be on a block...
        return;
      }

      if (!sel || !sel.data) {
        sel = this.dropdown.querySelector(".sel");
      }

      if (!sel) {
        return;
      }

      if (this.queryResult) {
        this.createDraggingBlock(this.queryResult.createBlock().createWorkspaceForm(), e, sel);
      }

      if (e.shiftKey) {
        this.floatBar.style.display = "";
        this.floatInput.focus();
      }
    }

    createDraggingBlock(newBlock, e, sel) {
      // This is mostly copied from https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/scratch_blocks_utils.js#L171
      // Some bits were removed or changed to fit our needs.
      this.workspace.setResizesEnabled(false);

      Blockly.Events.disable();
      try {
        Blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);

        var svgRootNew = newBlock.getSvgRoot();
        if (!svgRootNew) {
          throw new Error("newBlock is not rendered.");
        }

        let blockBounds = newBlock.svgPath_.getBoundingClientRect();
        let newBlockX = Math.floor((mouse.x - (blockBounds.left + blockBounds.right) / 2) / this.workspace.scale);
        let newBlockY = Math.floor((mouse.y - (blockBounds.top + blockBounds.bottom) / 2) / this.workspace.scale);
        newBlock.moveBy(newBlockX, newBlockY);
      } finally {
        Blockly.Events.enable();
      }
      if (Blockly.Events.isEnabled()) {
        Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
      }

      // var fakeEvent = {
      //   clientX: mouse.x,
      //   clientY: mouse.y,
      //   type: "mousedown",
      //   preventDefault: function () {
      //     e.preventDefault();
      //   },
      //   stopPropagation: function () {
      //     e.stopPropagation();
      //   },
      //   target: sel,
      // };
      // this.workspace.startDragWithFakeEvent(fakeEvent, newBlock);
    }

    inputChange() {
      var startTime = performance.now();

      const query = this.floatInput.innerText;

      this.queryResults = this.querier.queryWorkspace(query);
      this.queryResult = null;
      this.queryAutocompleteResult = null;

      console.log(this.queryResults);

      for (let i = 0; i < this.queryResults.length; i++) {
        const result = this.queryResults[i];
        if (!this.queryResult || (this.queryResult.isTruncated && !result.isTruncated)) this.queryResult = result;
        if (result.isTruncated && !this.queryAutocompleteResult) this.queryAutocompleteResult = result;
      }

      if (this.queryAutocompleteResult) {
        this.floatInputSuggestion.innerText = this.queryAutocompleteResult.autocomplete.substring(query.length);
        this.floatInputSuggestion.scrollIntoView();
      } else {
        this.floatInputSuggestion.innerText = "";
      }

      // if (this.testGroup.children[0]) this.testGroup.children[0].remove();
      while (this.testSvg.firstChild) this.testSvg.removeChild(this.testSvg.lastChild);

      const blockScale = 0.65;
      let canvasWidth = this.testSvg.getBoundingClientRect().width / blockScale;

      for (let i = 0; i < this.queryResults.length && i < 10; i++) {
        let container = this.testSvg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));

        let blockComponent = renderBlock(this.queryResults[i].createBlock(), container);
        var xTranslation = 0;
        if (blockComponent.width > canvasWidth) {
          xTranslation = (canvasWidth - blockComponent.width) * blockScale;
        }

        container.setAttribute("transform", `translate(${xTranslation}, ${i * 40 + 20}) scale(0.65)`);
      }

      var endTime = performance.now();
      console.log(`Worksapce query took ${endTime - startTime} milliseconds`);
    }

    inputKeyDown(e) {
      if (e.keyCode == 9) {
        // Tab
        if (this.queryAutocompleteResult?.isTruncated) {
          this.floatInput.innerText = this.queryAutocompleteResult.autocomplete;
          // Move cursor to the end of the newly inserted text
          let selection = window.getSelection();
          selection.selectAllChildren(this.floatInput);
          selection.collapseToEnd();

          this.inputChange(e);
        }
        e.stopPropagation();
        e.preventDefault();
      } else if (e.keyCode === 13) {
        // Enter
        let sel = this.dropdown.querySelector(".sel");

        if (this.queryResult) {
          this.createDraggingBlock(this.queryResult.createBlock().createWorkspaceForm(), e, sel);
        }

        this.hide();
        e.stopPropagation();
        e.preventDefault();
        return;
      } else if (e.keyCode === 27) {
        // Escape
        if (this.floatInput.innerText.length > 0) {
          this.floatInput.innerText = ""; // Clear search first, then close on second press
          this.inputChange(e);
        } else {
          this.hide();
        }
        e.stopPropagation();
        e.preventDefault();
        return;
      }
    }

    navigateFloatFilter(dir) {
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
        // centerTop(nxt.data.labelID);
      }
    }

    hide() {
      this.floatBar.style.display = "none";
      this.querier.clearWorkspaceIndex();
    }
  }
  const floatingInput = new FloatingInput();

  const _doWorkspaceClick_ = Blockly.Gesture.prototype.doWorkspaceClick_;
  Blockly.Gesture.prototype.doWorkspaceClick_ = function () {
    if (!addon.self.disabled && (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey)) {
      // Wheel button...
      floatingInput.show(this.mostRecentEvent_);
    }

    _doWorkspaceClick_.call(this);
  };

  document.addEventListener("mousemove", (e) => {
    mouse = { x: e.clientX, y: e.clientY };
  });
}
