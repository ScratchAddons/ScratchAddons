//@ts-check

import WorkspaceQuerier, { QueryResult } from "./WorkspaceQuerier.js";
import renderBlock, { BlockComponent, getBlockHeight } from "./BlockRenderer.js";
import { BlockInstance, BlockShape, BlockTypeInfo } from "./BlockTypeInfo.js";
import { onClearTextWidthCache } from "./module.js";

export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const PREVIEW_LIMIT = 50;

  const popupRoot = document.body.appendChild(document.createElement("div"));
  popupRoot.classList.add("sa-mcp-root");
  popupRoot.dir = addon.tab.direction;
  popupRoot.style.display = "none";

  const popupContainer = popupRoot.appendChild(document.createElement("div"));
  popupContainer.classList.add("sa-mcp-container");

  const popupInputContainer = popupContainer.appendChild(document.createElement("div"));
  popupInputContainer.classList.add(addon.tab.scratchClass("input_input-form"));
  popupInputContainer.classList.add("sa-mcp-input-wrapper");

  const popupInputSuggestion = popupInputContainer.appendChild(document.createElement("input"));
  popupInputSuggestion.classList.add("sa-mcp-input-suggestion");

  const popupInput = popupInputContainer.appendChild(document.createElement("input"));
  popupInput.classList.add("sa-mcp-input");
  popupInput.setAttribute("autocomplete", "off");

  const popupPreviewContainer = popupContainer.appendChild(document.createElement("div"));
  popupPreviewContainer.classList.add("sa-mcp-preview-container");

  const popupPreviewScrollbarSVG = popupContainer.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg")
  );
  popupPreviewScrollbarSVG.classList.add(
    "sa-mcp-preview-scrollbar",
    "blocklyScrollbarVertical",
    "blocklyMainWorkspaceScrollbar"
  );
  popupPreviewScrollbarSVG.style.display = "none";

  const popupPreviewScrollbarBackground = popupPreviewScrollbarSVG.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "rect")
  );
  popupPreviewScrollbarBackground.setAttribute("width", "11");
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
  popupPreviewBlocks.classList.add("sa-mcp-preview-blocks");

  const querier = new WorkspaceQuerier();

  let mousePosition = { x: 0, y: 0 };
  document.addEventListener("mousemove", (e) => {
    mousePosition = { x: e.clientX, y: e.clientY };
  });

  onClearTextWidthCache(closePopup);

  /**
   * @typedef ResultPreview
   * @property {BlockInstance} block
   * @property {((endOnly: boolean) => string)?} autocompleteFactory
   * @property {BlockComponent} renderedBlock
   * @property {SVGGElement} svgBlock
   * @property {SVGRectElement} svgBackground
   */
  /** @type {ResultPreview[]} */
  let queryPreviews = [];
  /** @type {QueryResult | null} */
  let queryIllegalResult = null;
  let selectedPreviewIdx = 0;
  /** @type {BlockTypeInfo[]?} */
  let blockTypes = null;
  let limited = false;

  let allowMenuClose = true;

  let popupPosition = null;
  let popupOrigin = null;

  let previewWidth = 0;
  let previewHeight = 0;

  let previewScale = 0;

  let previewMinHeight = 0;
  let previewMaxHeight = 0;

  function openPopup() {
    if (addon.self.disabled) return;

    // Don't show the menu if we're not in the code editor
    if (addon.tab.editorMode !== "editor") return;
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 0) return;

    Blockly.hideChaff();

    const workspace = addon.tab.traps.getWorkspace();
    blockTypes = BlockTypeInfo.getBlocks(Blockly, vm, workspace, msg);
    querier.indexWorkspace([...blockTypes]);
    blockTypes.sort((a, b) => {
      // Block order:
      // 1. variable reporters
      // 2. operators
      // 3. other variable blocks
      // 4. everything else
      const prio = (block) => ["operators", "data"].indexOf(block.category.name) - (block.id.startsWith("data_") && block.id !== "data_variable");
      return prio(b) - prio(a);
    });

    previewScale = window.innerWidth * 0.00005 + addon.settings.get("popup_scale") / 100;
    previewWidth = (window.innerWidth * addon.settings.get("popup_width")) / 100;
    previewMaxHeight = (window.innerHeight * addon.settings.get("popup_max_height")) / 100;

    popupContainer.style.width = previewWidth + "px";

    popupOrigin = { x: mousePosition.x, y: mousePosition.y };
    popupRoot.style.display = "";
    popupInput.value = "";
    popupInput.focus();
    updateInput();

    if (Blockly.registry) {
      // new Blockly: register delete area
      const component = new Blockly.DeleteArea();
      component.id = "saMiddleClickPopup";
      component.getClientRect = () => {
        const rect = popupContainer.getBoundingClientRect();
        return new Blockly.utils.Rect(rect.top, rect.bottom, rect.left, rect.right);
      };
      workspace.getComponentManager().addComponent({
        component,
        weight: 1,
        capabilities: [
          Blockly.ComponentManager.Capability.DELETE_AREA,
          Blockly.ComponentManager.Capability.DRAG_TARGET,
        ]
      });
      workspace.recordDragTargets();
    }
  }

  function closePopup() {
    if (allowMenuClose) {
      popupOrigin = null;
      popupPosition = null;
      popupRoot.style.display = "none";
      blockTypes = null;
      querier.clearWorkspaceIndex();
      if (Blockly.registry) {
        // new Blockly: unregister delete area
        const workspace = addon.tab.traps.getWorkspace();
        workspace.getComponentManager().removeComponent("saMiddleClickPopup");
        workspace.recordDragTargets();
      }
    }
  }

  popupInput.addEventListener("input", updateInput);

  function updateInput() {
    /**
     * @typedef MenuItem
     * @property {BlockInstance} block
     * @property {(endOnly: boolean) => string} [autocompleteFactory]
     */
    /** @type {MenuItem[]} */
    const blockList = [];

    if (popupInput.value.trim().length === 0) {
      queryIllegalResult = null;
      if (blockTypes)
        for (const blockType of blockTypes) {
          blockList.push({
            block: blockType.createBlock(),
          });
        }
      limited = false;
    } else {
      // Get the list of blocks to display using the input content
      const queryResultObj = querier.queryWorkspace(popupInput.value);
      const queryResults = queryResultObj.results;
      queryIllegalResult = queryResultObj.illegalResult;
      limited = queryResultObj.limited;

      if (queryResults.length > PREVIEW_LIMIT) queryResults.length = PREVIEW_LIMIT;

      for (const queryResult of queryResults) {
        blockList.push({
          block: queryResult.getBlock(),
          autocompleteFactory: (endOnly) => queryResult.toText(endOnly),
        });
      }
    }

    // @ts-ignore Delete the old previews
    while (popupPreviewBlocks.firstChild) popupPreviewBlocks.removeChild(popupPreviewBlocks.lastChild);

    // Create the new previews
    queryPreviews.length = 0;
    let y = 0;
    for (let resultIdx = 0; resultIdx < blockList.length; resultIdx++) {
      const result = blockList[resultIdx];

      const mouseMoveListener = () => {
        updateSelection(resultIdx);
      };

      const mouseDownListener = (e) => {
        e.stopPropagation();
        e.preventDefault();
        updateSelection(resultIdx);
        allowMenuClose = !e.shiftKey;
        selectBlock(e);
        allowMenuClose = true;
        if (e.shiftKey) popupInput.focus();
      };

      const svgBackground = popupPreviewBlocks.appendChild(
        document.createElementNS("http://www.w3.org/2000/svg", "rect")
      );

      const height = getBlockHeight(result.block);
      svgBackground.setAttribute("transform", `translate(0, ${(y + height / 10) * previewScale})`);
      svgBackground.setAttribute("height", height * previewScale + "px");
      svgBackground.classList.add("sa-mcp-preview-block-bg");
      svgBackground.addEventListener("mousemove", mouseMoveListener);
      if (Blockly.registry) svgBackground.addEventListener("pointerdown", mouseDownListener); // new Blockly
      else svgBackground.addEventListener("mousedown", mouseDownListener);

      const svgBlock = popupPreviewBlocks.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
      svgBlock.addEventListener("mousemove", mouseMoveListener);
      if (Blockly.registry) svgBlock.addEventListener("pointerdown", mouseDownListener); // new Blockly
      else svgBlock.addEventListener("mousedown", mouseDownListener);
      svgBlock.classList.add("sa-mcp-preview-block");

      const renderedBlock = renderBlock(result.block, svgBlock);

      queryPreviews.push({
        block: result.block,
        autocompleteFactory: result.autocompleteFactory ?? null,
        renderedBlock,
        svgBlock,
        svgBackground,
      });

      y += height;
    }

    const height = (y + 8) * previewScale;

    if (height < previewMinHeight) previewHeight = previewMinHeight;
    else if (height > previewMaxHeight) previewHeight = previewMaxHeight;
    else previewHeight = height;

    popupPreviewBlocks.setAttribute("height", `${height}px`);
    popupPreviewContainer.style.height = previewHeight + "px";
    popupPreviewScrollbarSVG.style.height = previewHeight + "px";
    popupPreviewScrollbarBackground.setAttribute("height", "" + previewHeight);
    popupInputContainer.dataset["error"] = "" + limited;

    popupPosition = { x: popupOrigin.x + 16, y: popupOrigin.y - 8 };

    const popupHeight = popupContainer.getBoundingClientRect().height;
    const popupBottom = popupPosition.y + popupHeight;
    if (popupBottom > window.innerHeight) {
      popupPosition.y -= popupBottom - window.innerHeight;
    }

    popupRoot.style.top = popupPosition.y + "px";
    popupRoot.style.left = popupPosition.x + "px";

    selectedPreviewIdx = -1;
    updateSelection(0);
    updateCursor();
    updateScrollbar();

    if (Blockly.registry) {
      // new Blockly: update delete area after resizing popup
      const workspace = addon.tab.traps.getWorkspace();
      workspace.recordDragTargets();
    }
  }

  function updateSelection(newIdx) {
    if (selectedPreviewIdx === newIdx) return;

    const oldSelection = queryPreviews[selectedPreviewIdx];
    if (oldSelection) {
      oldSelection.svgBackground.classList.remove("sa-mcp-preview-block-bg-selection");
      oldSelection.svgBlock.classList.remove("sa-mcp-preview-block-selection");
    }

    if (queryPreviews.length === 0 && queryIllegalResult) {
      popupInputSuggestion.value =
        popupInput.value + queryIllegalResult.toText(true).substring(popupInput.value.length);
      return;
    }

    const newSelection = queryPreviews[newIdx];
    if (newSelection && newSelection.autocompleteFactory) {
      newSelection.svgBackground.classList.add("sa-mcp-preview-block-bg-selection");
      newSelection.svgBlock.classList.add("sa-mcp-preview-block-selection");

      newSelection.svgBackground.scrollIntoView({
        block: "nearest",
        behavior: Math.abs(newIdx - selectedPreviewIdx) > 1 ? "smooth" : "auto",
      });

      popupInputSuggestion.value =
        popupInput.value + newSelection.autocompleteFactory(true).substring(popupInput.value.length);
    } else {
      popupInputSuggestion.value = "";
    }

    selectedPreviewIdx = newIdx;
  }

  // @ts-ignore
  document.addEventListener("selectionchange", updateCursor);

  function updateCursor() {
    const cursorPos = popupInput.selectionStart ?? 0;
    const cursorPosRel = popupInput.value.length === 0 ? 0 : cursorPos / popupInput.value.length;

    let y = 0;
    for (let previewIdx = 0; previewIdx < queryPreviews.length; previewIdx++) {
      const preview = queryPreviews[previewIdx];

      var blockX = 5;
      if (blockX + preview.renderedBlock.width > previewWidth / previewScale)
        blockX += (previewWidth / previewScale - blockX - preview.renderedBlock.width) * previewScale * cursorPosRel;
      var blockY = (y + 30) * previewScale;

      preview.svgBlock.setAttribute("transform", `translate(${blockX}, ${blockY}) scale(${previewScale})`);

      y += getBlockHeight(preview.block);
    }

    popupInputSuggestion.scrollLeft = popupInput.scrollLeft;
  }

  popupPreviewContainer.addEventListener("scroll", updateScrollbar);

  function updateScrollbar() {
    const scrollTop = popupPreviewContainer.scrollTop;
    const scrollY = popupPreviewContainer.scrollHeight;

    if (scrollY <= previewHeight) {
      popupPreviewScrollbarSVG.style.display = "none";
      return;
    }

    const scrollbarHeight = (previewHeight / scrollY) * previewHeight;
    const scrollbarY = (scrollTop / scrollY) * previewHeight;

    popupPreviewScrollbarSVG.style.display = "";
    popupPreviewScrollbarHandle.setAttribute("height", "" + scrollbarHeight);
    popupPreviewScrollbarHandle.setAttribute("y", "" + scrollbarY);
  }

  function selectBlock(e) {
    const selectedPreview = queryPreviews[selectedPreviewIdx];
    if (!selectedPreview) return;

    const workspace = Blockly.getMainWorkspace();
    // This is mostly copied from https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/scratch_blocks_utils.js#L171
    // Some bits were removed or changed to fit our needs.
    workspace.setResizesEnabled(false);

    let newBlock;
    Blockly.Events.disable();
    try {
      newBlock = selectedPreview.block.createWorkspaceForm();
      if (!Blockly.registry) {
        // New Blockly doesn't currently change shadow IDs when copying blocks,
        // so the addon only does this on old Blockly.
        Blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);
      }

      var svgRootNew = newBlock.getSvgRoot();
      if (!svgRootNew) {
        throw new Error("newBlock is not rendered.");
      }

      let svgPath;
      if (newBlock.pathObject) svgPath = newBlock.pathObject.svgPath; // new Blockly
      else svgPath = newBlock.svgPath_;
      let blockBounds = svgPath.getBoundingClientRect();
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
      stopPropagation: function () {},
      preventDefault: function () {},
      target: selectedPreview.svgBlock,
    };
    if (Blockly.registry) {
      // new Blockly expects a pointerdown event
      fakeEvent.type = "pointerdown";
      fakeEvent.pointerType = "mouse";
      // If the block is being dragged using the mouse or touch, the correct pointerId
      // needs to be set so that Blockly recognizes the associated pointerup event.
      // If the block is selected using the keyboard, pointerId will be undefined and a
      // click will be necessary to end the "drag".
      fakeEvent.pointerId = e.pointerId;
      // Start dragging the block
      // Based on old Blockly's WorkspaceSvg.startDragWithFakeEvent() and Gesture.forceStartBlockDrag()
      Blockly.Touch.clearTouchIdentifier();
      Blockly.Touch.checkTouchIdentifier(fakeEvent);
      const gesture = workspace.getGesture(fakeEvent);
      gesture.handleBlockStart(fakeEvent, newBlock);
      gesture.handleWsStart(fakeEvent, workspace);
      gesture.dragging = true;
      gesture.hasExceededDragRadius = true;
      gesture.dragger = gesture.createDragger(newBlock, workspace);
      gesture.dragger.onDragStart(fakeEvent);
    } else {
      if (workspace.getGesture(fakeEvent)) {
        workspace.startDragWithFakeEvent(fakeEvent, newBlock);
      }
    }
  }

  function acceptAutocomplete() {
    let factory;
    if (queryPreviews[selectedPreviewIdx]) factory = queryPreviews[selectedPreviewIdx].autocompleteFactory;
    else factory = () => popupInputSuggestion.value;
    if (popupInputSuggestion.value.length === 0 || !factory) return;
    popupInput.value = factory(false);
    // Move cursor to the end of the newly inserted text
    popupInput.selectionStart = popupInput.value.length + 1;
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
        selectBlock(e);
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
  const doWorkspaceClickMethodName = Blockly.registry ? "doWorkspaceClick" : "doWorkspaceClick_";
  const _doWorkspaceClick_ = Blockly.Gesture.prototype[doWorkspaceClickMethodName];
  Blockly.Gesture.prototype[doWorkspaceClickMethodName] = function () {
    const event = Blockly.registry ? this.mostRecentEvent : this.mostRecentEvent_;
    if (event.button === 1 || event.shiftKey) openPopup();
    mousePosition = { x: event.clientX, y: event.clientY };
    _doWorkspaceClick_.call(this);
  };

  if (!Blockly.registry) {
    // The popup should delete blocks dragged ontop of it
    // For new Blockly, this is implemented using Blockly.ComponentManager instead
    const _isDeleteArea = Blockly.WorkspaceSvg.prototype.isDeleteArea;
    Blockly.WorkspaceSvg.prototype.isDeleteArea = function (e) {
      if (popupPosition) {
        if (
          e.clientX > popupPosition.x &&
          e.clientX < popupPosition.x + previewWidth &&
          e.clientY > popupPosition.y &&
          e.clientY < popupPosition.y + previewHeight
        ) {
          return Blockly.DELETE_AREA_TOOLBOX;
        }
      }
      return _isDeleteArea.call(this, e);
    };
  }
}
