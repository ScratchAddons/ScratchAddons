//@ts-check

import WorkspaceQuerier, { QueryResult } from "./WorkspaceQuerier.js";
import renderBlock, { BlockComponent } from "./BlockRenderer.js";

export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const PREVIEW_WIDTH_PX = 320;
  const PREVIEW_HEIGHT_PX = 400;

  const PREVIEW_SCALE = 0.675;
  const PREVIEW_LIMIT = 50;

  const popupRoot = document.body.appendChild(document.createElement("div"));
  popupRoot.id = "sa-mcp-root";
  popupRoot.dir = addon.tab.direction;
  popupRoot.style.display = "none";

  const popupContainer = popupRoot.appendChild(document.createElement("div"));
  popupContainer.id = "sa-mcp-container";

  const popupInputContainer = popupContainer.appendChild(document.createElement("div"));
  popupInputContainer.classList.add(addon.tab.scratchClass("input_input-form"));
  popupInputContainer.id = "sa-mcp-input-wrapper";
  popupInputContainer.style.width = PREVIEW_WIDTH_PX + "px";

  const popupInputSuggestion = popupInputContainer.appendChild(document.createElement("input"));
  popupInputSuggestion.id = "sa-mcp-input-suggestion";

  const popupInput = popupInputContainer.appendChild(document.createElement("input"));
  popupInput.id = "sa-mcp-input";

  const popupPreviewContainer = popupContainer.appendChild(document.createElement("div"));
  popupPreviewContainer.id = "sa-mcp-preview-container";
  popupPreviewContainer.style.height = PREVIEW_HEIGHT_PX + "px";

  const popupPreviewScrollbarSVG = popupContainer.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg")
  );
  popupPreviewScrollbarSVG.id = "sa-mcp-preview-scrollbar";
  popupPreviewScrollbarSVG.classList.add("blocklyScrollbarVertical", "blocklyMainWorkspaceScrollbar");
  popupPreviewScrollbarSVG.style.height = PREVIEW_HEIGHT_PX + "px";
  popupPreviewScrollbarSVG.style.display = "none";

  const popupPreviewScrollbarBackground = popupPreviewScrollbarSVG.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "rect")
  );
  popupPreviewScrollbarBackground.setAttribute("width", "11");
  popupPreviewScrollbarBackground.setAttribute("height", "" + PREVIEW_HEIGHT_PX);
  popupPreviewScrollbarBackground.classList.add("blocklyScrollbarBackground");

  const popupPreviewScrollbarHandle = popupPreviewScrollbarSVG.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "rect")
  );
  popupPreviewScrollbarHandle.setAttribute("rx", "3");
  popupPreviewScrollbarHandle.setAttribute("ry", "3");
  popupPreviewScrollbarHandle.setAttribute("width", "6");
  popupPreviewScrollbarHandle.setAttribute("x", "2.5");
  popupPreviewScrollbarHandle.classList.add("blocklyScrollbarHandle");

  const popupPreviewBlocks = popupPreviewContainer.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg")
  );
  popupPreviewBlocks.id = "sa-mcp-preview-blocks";

  const querier = new WorkspaceQuerier(Blockly, msg);

  let mousePosition = { x: 0, y: 0 };
  document.addEventListener("mousemove", (e) => {
    mousePosition = { x: e.clientX, y: e.clientY };
  });

  /**
   * @typedef ResultPreview
   * @property {QueryResult} result
   * @property {BlockComponent} block
   * @property {SVGGElement} svgBlock
   * @property {SVGRectElement} svgBackground
   */
  /** @type {ResultPreview[]} */
  let queryPreviews = [];
  let selectedPreviewIdx = 0;

  let allowMenuClose = true;
  let popupPosition = null;

  function openPopup() {
    if (addon.self.disabled) return;

    // Don't show the menu if we're not in the code editor
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 0) return;

    querier.indexWorkspace(Blockly.getMainWorkspace());

    let top = mousePosition.y - 8;
    const popupDimensions = popupContainer.getBoundingClientRect();
    if (top + popupDimensions.height > window.innerHeight) top = window.innerHeight - popupDimensions.height;

    let left = mousePosition.x + 16;

    popupPosition = { x: left, y: top };
    popupRoot.style.top = top + "px";
    popupRoot.style.left = left + "px";
    popupRoot.style.display = "";
    popupInput.value = "";
    popupInput.focus();
    updateInput();
  }

  function closePopup() {
    if (allowMenuClose) {
      popupPosition = null;
      popupRoot.style.display = "none";
      querier.clearWorkspaceIndex();
    }
  }

  popupInput.addEventListener("input", updateInput);

  function updateInput() {
    // Get the list of blocks to display using the input content
    const queryResults = querier.queryWorkspace(popupInput.value);

    if (queryResults.length > PREVIEW_LIMIT) queryResults.length = PREVIEW_LIMIT;

    // @ts-ignore Delete the old previews
    while (popupPreviewBlocks.firstChild) popupPreviewBlocks.removeChild(popupPreviewBlocks.lastChild);

    // Create the new previews
    queryPreviews.length = 0;
    for (let resultIdx = 0; resultIdx < queryResults.length; resultIdx++) {
      const result = queryResults[resultIdx];

      var blockY = resultIdx * 40 + 2;

      const mouseMoveListener = () => {
        updateSelection(resultIdx);
      };

      const mouseDownListener = (e) => {
        e.stopPropagation();
        e.preventDefault();
        updateSelection(resultIdx);
        allowMenuClose = !e.shiftKey;
        selectBlock();
        allowMenuClose = true;
        if (e.shiftKey) popupInput.focus();
      };

      const svgBackground = popupPreviewBlocks.appendChild(
        document.createElementNS("http://www.w3.org/2000/svg", "rect")
      );
      svgBackground.setAttribute("transform", `translate(0, ${blockY})`);
      svgBackground.classList.add("sa-mcp-preview-block-bg");
      svgBackground.addEventListener("mousemove", mouseMoveListener);
      svgBackground.addEventListener("mousedown", mouseDownListener);

      const svgBlock = popupPreviewBlocks.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
      svgBlock.addEventListener("mousemove", mouseMoveListener);
      svgBlock.addEventListener("mousedown", mouseDownListener);
      svgBlock.classList.add("sa-mcp-preview-block");

      const block = renderBlock(result.createBlock(), svgBlock);

      queryPreviews.push({ result, block, svgBlock, svgBackground });
    }

    popupPreviewBlocks.setAttribute("height", `${queryPreviews.length * 40}px`);

    selectedPreviewIdx = -1;
    updateSelection(0);
    updateCursor();
    updateScrollbar();
  }

  function updateSelection(newIdx) {
    if (selectedPreviewIdx === newIdx) return;

    const oldSelection = queryPreviews[selectedPreviewIdx];
    if (oldSelection) {
      oldSelection.svgBackground.classList.remove("sa-mcp-preview-block-bg-selection");
      oldSelection.svgBlock.classList.remove("sa-mcp-preview-block-selection");
    }

    const newSelection = queryPreviews[newIdx];
    if (newSelection) {
      newSelection.svgBackground.classList.add("sa-mcp-preview-block-bg-selection");
      newSelection.svgBlock.classList.add("sa-mcp-preview-block-selection");

      newSelection.svgBackground.scrollIntoView({
        block: "nearest",
        behavior: Math.abs(newIdx - selectedPreviewIdx) > 1 ? "smooth" : "auto",
      });

      popupInputSuggestion.value = popupInput.value + newSelection.result.text.substring(popupInput.value.length);

      // Move the selected block to the front
      popupPreviewBlocks.appendChild(newSelection.svgBackground);
      popupPreviewBlocks.appendChild(newSelection.svgBlock);
    } else {
      popupInputSuggestion.value = "";
    }

    selectedPreviewIdx = newIdx;
  }

  // @ts-ignore
  document.addEventListener("selectionchange", updateCursor);

  function updateCursor() {
    const cursorPos = popupInput.selectionStart ?? 0;
    const cursorPosRel = cursorPos / popupInput.value.length;

    for (let previewIdx = 0; previewIdx < queryPreviews.length; previewIdx++) {
      const preview = queryPreviews[previewIdx];

      var blockX = 5;
      if (blockX + preview.block.width > PREVIEW_WIDTH_PX / PREVIEW_SCALE)
        blockX += (PREVIEW_WIDTH_PX / PREVIEW_SCALE - blockX - preview.block.width) * PREVIEW_SCALE * cursorPosRel;

      var blockY = previewIdx * 40 + 20;

      preview.svgBlock.setAttribute("transform", `translate(${blockX}, ${blockY}) scale(${PREVIEW_SCALE})`);
    }

    popupInputSuggestion.scrollLeft = popupInput.scrollLeft;
  }

  popupPreviewContainer.addEventListener("scroll", updateScrollbar);

  function updateScrollbar() {
    const scrollTop = popupPreviewContainer.scrollTop;
    const scrollY = popupPreviewContainer.scrollHeight;

    if (scrollY <= PREVIEW_HEIGHT_PX) {
      popupPreviewScrollbarSVG.style.display = "none";
      return;
    }

    const scrollbarHeight = (PREVIEW_HEIGHT_PX / scrollY) * PREVIEW_HEIGHT_PX;
    const scrollbarY = (scrollTop / scrollY) * PREVIEW_HEIGHT_PX;

    popupPreviewScrollbarSVG.style.display = "";
    popupPreviewScrollbarHandle.setAttribute("height", "" + scrollbarHeight);
    popupPreviewScrollbarHandle.setAttribute("y", "" + scrollbarY);
  }

  function selectBlock() {
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

    let fakeEvent = {
      clientX: mousePosition.x,
      clientY: mousePosition.y,
      type: "mousedown",
      stopPropagation: function () { },
      preventDefault: function () { },
      target: selectedPreview.svgBlock,
    };
    workspace.startDragWithFakeEvent(fakeEvent, newBlock);
  }

  function acceptAutocomplete() {
    if (popupInputSuggestion.value.length === 0) return;
    popupInput.value += popupInputSuggestion.value.substring(popupInput.value.length);
    // Move cursor to the end of the newly inserted text
    popupInput.selectionStart = popupInput.value.length;
    updateInput();
  }

  popupInput.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Escape":
        // If there's something in the input, clear it
        if (popupInput.value.length > 0) {
          popupInput.value = "";
          updateInput();
        } else {
          // If not, close the menu
          closePopup();
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
        closePopup();
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
      case "ArrowLeft":
    }
  });

  // Prevent pasting rich text by converting it into plain text
  popupInput.addEventListener("paste", (e) => {
    if (e.clipboardData && popupPosition) {
      e.preventDefault();
      var text = e.clipboardData.getData("text/plain");
      text = text.replace("\n", "");
      document.execCommand("insertText", false, text);
    }
  });

  popupInput.addEventListener("focusout", closePopup);

  // Open on ctrl + space
  document.addEventListener("keydown", (e) => {
    if (e.key === " " && (e.ctrlKey || e.metaKey)) {
      openPopup();
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Open on mouse wheel button
  const _doWorkspaceClick_ = Blockly.Gesture.prototype.doWorkspaceClick_;
  Blockly.Gesture.prototype.doWorkspaceClick_ = function () {
    if (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey) openPopup();
    _doWorkspaceClick_.call(this);
  };

  // The popup should delete blocks dragged ontop of it
  const _isDeleteArea = Blockly.WorkspaceSvg.prototype.isDeleteArea;
  Blockly.WorkspaceSvg.prototype.isDeleteArea = function (e) {
    if (popupPosition) {
      if (
        e.clientX > popupPosition.x &&
        e.clientX < popupPosition.x + PREVIEW_WIDTH_PX &&
        e.clientY > popupPosition.y &&
        e.clientY < popupPosition.y + PREVIEW_HEIGHT_PX
      ) {
        return Blockly.DELETE_AREA_TOOLBOX;
      }
    }
    return _isDeleteArea.call(this, e);
  };
}
