//@ts-check

import WorkspaceQuerier, { QueryResult } from "./WorkspaceQuerier.js";
import renderBlock from "./BlockRenderer.js";

export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const POPUP_WIDTH_PX = 320;
  const POPUP_HEIGHT_PX = 420;

  const PREVIEW_SCALE = 0.65;

  const popupRoot = document.body.appendChild(document.createElement("div"));
  popupRoot.id = "sa-mcp-root";
  popupRoot.dir = addon.tab.direction;
  popupRoot.style.display = "none";

  const popupContainer = popupRoot.appendChild(document.createElement("div"));
  popupContainer.id = "sa-mcp-container";
  popupContainer.style.width = POPUP_WIDTH_PX + "px";
  popupContainer.style.height = POPUP_HEIGHT_PX + "px";

  const popupInputContainer = popupContainer.appendChild(document.createElement("div"));
  popupInputContainer.classList.add(addon.tab.scratchClass("input_input-form"));
  popupInputContainer.id = "sa-mcp-input-wrapper";

  const popupInput = popupInputContainer.appendChild(document.createElement("div"));
  popupInput.contentEditable = "true";
  popupInput.id = "sa-mcp-input";

  const popupInputSuggestion = popupInputContainer.appendChild(document.createElement("span"));
  popupInputSuggestion.contentEditable = "false";
  popupInputSuggestion.id = "sa-mcp-input-suggestion";

  const popupPreviewContainer = popupContainer.appendChild(document.createElement("div"));
  popupPreviewContainer.id = "sa-mcp-preview-container";

  const popupPreviewSVG = popupPreviewContainer.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg")
  );
  popupPreviewSVG.id = "sa-mcp-preview";

  const querier = new WorkspaceQuerier(Blockly, msg);

  let mousePosition = { x: 0, y: 0 };
  document.addEventListener("mousemove", (e) => {
    mousePosition = { x: e.clientX, y: e.clientY };
  });

  /**
   * @typedef ResultPreview
   * @property {QueryResult} result
   * @property {SVGGElement} svgBlock
   * @property {SVGRectElement} svgBackground
   */
  /** @type {ResultPreview[]} */
  let queryPreviews = [];
  let selectedPreviewIdx = 0;

  let allowMenuClose = true;

  function openMenu() {
    if (addon.self.disabled) return;

    // Don't show the menu if we're not in the code editor
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 0) return;

    querier.indexWorkspace(Blockly.getMainWorkspace());

    let top = mousePosition.y - 8;
    if (top + POPUP_HEIGHT_PX > window.innerHeight) top = window.innerHeight - POPUP_HEIGHT_PX;
    popupRoot.style.top = top + "px";

    popupRoot.style.left = mousePosition.x + 16 + "px";
    popupRoot.style.display = "";
    popupInput.innerText = "";
    popupInput.focus();
    updateInput();
  }

  function closeMenu() {
    if (allowMenuClose) {
      popupRoot.style.display = "none";
      querier.clearWorkspaceIndex();
    }
  }

  function getQueryString() {
    let queryString = popupInput.innerText;

    // Fix for firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1615852
    if (popupInput.lastElementChild?.tagName === "BR") queryString = queryString.substring(0, queryString.length - 1);

    return queryString;
  }

  function updateInput() {
    // Get the list of blocks to display using the input content
    const queryResults = querier.queryWorkspace(getQueryString());

    // @ts-ignore Delete the old previews
    while (popupPreviewSVG.firstChild) popupPreviewSVG.removeChild(popupPreviewSVG.lastChild);

    // Create the new previews
    queryPreviews.length = 0;
    for (let resultIdx = 0; resultIdx < queryResults.length; resultIdx++) {
      const result = queryResults[resultIdx];

      var blockY = resultIdx * 40;

      const mouseMoveListener = () => {
        updateSelection(resultIdx);
      };

      const svgBackground = popupPreviewSVG.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
      svgBackground.setAttribute("transform", `translate(0, ${blockY})`);
      svgBackground.classList.add("sa-mcp-preview-block-bg");
      svgBackground.addEventListener("mousemove", mouseMoveListener);

      const svgBlock = popupPreviewSVG.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
      const block = renderBlock(result.createBlock(), svgBlock);

      // If the block is too long to fit in the preview, move it over so we can see end
      var blockX = 0;
      if (block.width > POPUP_WIDTH_PX / PREVIEW_SCALE)
        blockX = (POPUP_WIDTH_PX / PREVIEW_SCALE - block.width) * PREVIEW_SCALE;

      svgBlock.setAttribute("transform", `translate(${blockX + 5}, ${blockY + 20}) scale(${PREVIEW_SCALE})`);
      svgBlock.addEventListener("mousemove", mouseMoveListener);
      svgBlock.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        updateSelection(resultIdx);
        allowMenuClose = !e.shiftKey;
        selectBlock(true);
        allowMenuClose = true;
        if (e.shiftKey) popupInput.focus();
      });

      queryPreviews.push({ result, svgBlock, svgBackground });
    }

    popupPreviewSVG.setAttribute("height", `${queryPreviews.length * 40}px`);

    selectedPreviewIdx = -1;
    updateSelection(0);
  }

  function updateSelection(newIdx) {
    if (selectedPreviewIdx === newIdx) return;

    const oldSelection = queryPreviews[selectedPreviewIdx];
    if (oldSelection) {
      oldSelection.svgBackground.classList.remove("sa-mcp-preview-block-bg-selection");
    }

    const newSelection = queryPreviews[newIdx];
    if (newSelection) {
      newSelection.svgBackground.classList.add("sa-mcp-preview-block-bg-selection");

      newSelection.svgBackground.scrollIntoView({
        block: "nearest",
        behavior: Math.abs(newIdx - selectedPreviewIdx) > 1 ? "smooth" : "auto",
      });

      popupInputSuggestion.innerText = newSelection.result.autocomplete.substring(getQueryString().length);

      // Move the selected block to the front
      popupPreviewSVG.appendChild(newSelection.svgBackground);
      popupPreviewSVG.appendChild(newSelection.svgBlock);
    } else {
      popupInputSuggestion.innerText = "";
    }

    selectedPreviewIdx = newIdx;
  }

  function selectBlock(startDrag = false) {
    const selectedPreview = queryPreviews[selectedPreviewIdx];
    if (!selectedPreview) return;

    const newBlock = selectedPreview.result.createBlock().createWorkspaceForm();
    const workspace = Blockly.getMainWorkspace();
    // This is mostly copied from https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/scratch_blocks_utils.js#L171
    // Some bits were removed or changed to fit our needs.
    workspace.setResizesEnabled(false);

    Blockly.Events.disable();
    try {
      Blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);

      var svgRootNew = newBlock.getSvgRoot();
      if (!svgRootNew) {
        throw new Error("newBlock is not rendered.");
      }

      let blockBounds = newBlock.svgPath_.getBoundingClientRect();
      let newBlockX = Math.floor((mousePosition.x - (blockBounds.left + blockBounds.right) / 2) / workspace.scale);
      let newBlockY = Math.floor((mousePosition.y - (blockBounds.top + blockBounds.bottom) / 2) / workspace.scale);
      newBlock.moveBy(newBlockX, newBlockY);
    } finally {
      Blockly.Events.enable();
    }
    if (Blockly.Events.isEnabled()) {
      Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
    }

    if (startDrag) {
      let fakeEvent = {
        clientX: mousePosition.x,
        clientY: mousePosition.y,
        type: "mousedown",
        stopPropagation: function () {},
        preventDefault: function () {},
        target: selectedPreview.svgBlock,
      };
      workspace.startDragWithFakeEvent(fakeEvent, newBlock);
    }
  }

  function acceptAutocomplete() {
    if (popupInputSuggestion.innerText.length === 0) return;
    popupInput.innerText = getQueryString() + popupInputSuggestion.innerText;
    updateInput();
    // Move cursor to the end of the newly inserted text
    let selection = window.getSelection();
    if (selection) {
      selection.selectAllChildren(popupInput);
      selection.collapseToEnd();
    }
  }

  popupInput.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Escape":
        // If there's something in the input, clear it
        if (popupInput.innerText.length > 0) {
          popupInput.innerText = "";
          updateInput();
        } else {
          // If not, close the menu
          closeMenu();
        }
        e.stopPropagation();
        e.preventDefault();
        break;
      case "Tab":
        acceptAutocomplete();
        e.stopPropagation();
        e.preventDefault();
        break;
      case "Enter":
        selectBlock();
        closeMenu();
        e.stopPropagation();
        e.preventDefault();
        break;
      case "ArrowDown":
        if (selectedPreviewIdx + 1 >= queryPreviews.length) updateSelection(0);
        else updateSelection(selectedPreviewIdx + 1);
        e.stopPropagation();
        e.preventDefault();
        break;
      case "ArrowUp":
        if (selectedPreviewIdx - 1 < 0) updateSelection(queryPreviews.length - 1);
        else updateSelection(selectedPreviewIdx - 1);
        e.stopPropagation();
        e.preventDefault();
        break;
    }
  });

  // Prevent pasting rich text by converting it into plain text
  popupInput.addEventListener("paste", (e) => {
    if (e.clipboardData) {
      e.preventDefault();
      var text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
  });

  popupInput.addEventListener("input", updateInput);

  popupInput.addEventListener("focusout", closeMenu);

  // Open on ctrl + space
  document.addEventListener("keydown", (e) => {
    if (e.key === " " && (e.ctrlKey || e.metaKey)) {
      openMenu();
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Open on mouse wheel button
  const _doWorkspaceClick_ = Blockly.Gesture.prototype.doWorkspaceClick_;
  Blockly.Gesture.prototype.doWorkspaceClick_ = function () {
    if (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey) openMenu();
    _doWorkspaceClick_.call(this);
  };
}
