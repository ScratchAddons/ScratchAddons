export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  let modifierHeld = false;
  let inInsertionMarkerUpdate = false;
  let disableNextModifierRelease = false;
  let overrideStartRadius = -1;

  /**
   * @returns {ScratchBlocks.Gesture|null}
   */
  const getBlockDraggingGesture = () => {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) {
      return null;
    }

    const gesture = workspace.currentGesture_;
    if (!gesture) {
      return null;
    }

    if (!gesture.blockDragger_) {
      return null;
    }
    return gesture;
  };

  /**
   * Determines, for example, whether the control key is currently pressed.
   * Note that if someone presses control while focusing another window, switches to this tab, then
   * presses a letter, e.ctrlKey === true though we never get an event with e.key === "Control"
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  const isModifierKeyHeld = (e) => {
    const key = addon.settings.get("key");
    if (key === "ctrl") {
      return e.ctrlKey || e.metaKey;
    } else if (key === "alt") {
      return e.altKey;
    } else if (key === "shift") {
      return e.shiftKey;
    }
    return false;
  };

  /**
   * Determines, for example, whether the control key itself was pressed.
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  const isModifierKeyExactly = (e) => {
    const key = addon.settings.get("key");
    if (key === "ctrl") {
      return e.key === "Control" || e.key === "Meta";
    } else if (key === "alt") {
      return e.key === "Alt";
    } else if (key === "shift") {
      return e.key === "Shift";
    }
    return false;
  };

  /**
   * Only alt tends to have side-effects that we want to disable
   * @returns {boolean}
   */
  const shouldDisableModifier = () => addon.settings.get("key") === "alt";

  const forceUpdateDragPreview = () => {
    if (addon.self.disabled) {
      return;
    }

    const gesture = getBlockDraggingGesture();
    if (!gesture) {
      return;
    }

    try {
      // If something is already selected, the maximum distance that Scratch will tolerate is larger
      // than if nothing is selected. From my testing it feels right to preserve that larger distance
      // through the gesture.handleMove() below so that it's more likely that another connection will
      // get selected.
      const insertionMarkerManager = gesture.blockDragger_.draggedConnectionManager_;
      overrideStartRadius = insertionMarkerManager.getStartRadius_();

      // Hide the current preview
      // https://github.com/scratchfoundation/scratch-blocks/blob/d0701601145ab1185f8684be9112684e606e8c54/core/insertion_marker_manager.js#L520
      if (insertionMarkerManager.markerConnection_) {
        ScratchBlocks.Events.disable();
        insertionMarkerManager.hidePreview_();
        ScratchBlocks.Events.enable();
      }
      insertionMarkerManager.markerConnection_ = null;
      insertionMarkerManager.closestConnection_ = null;
      insertionMarkerManager.localConnection_ = null;

      // Display a fresh preview by replaying the most recent user input
      const mostRecentEvent = gesture.mostRecentEvent_;
      gesture.handleMove(mostRecentEvent);
    } finally {
      overrideStartRadius = -1;
    }
  };

  /**
   * @param {KeyboardEvent} e
   */
  const handleKeyEvent = (e) => {
    const isDragging = !!getBlockDraggingGesture();
    const newModifier = isModifierKeyHeld(e);

    if (newModifier !== modifierHeld) {
      modifierHeld = newModifier;
      if (isDragging) {
        forceUpdateDragPreview();
      }
    }

    // Disable alt opening browser menu in Firefox and stealing focus from the page.
    // This applies while dragging a block (we expect people to use the modifier) or once
    // after dropping a block (we expect people to stop pressing the modifier after)
    if (isDragging || disableNextModifierRelease) {
      if (isModifierKeyExactly(e) && shouldDisableModifier()) {
        e.preventDefault();
      }
      disableNextModifierRelease = false;
    }
  };

  document.addEventListener("keydown", handleKeyEvent);
  document.addEventListener("keyup", handleKeyEvent);

  // To disable nesting, we return null here so that isSurroundingC is always false in
  // https://github.com/scratchfoundation/scratch-blocks/blob/d0701601145ab1185f8684be9112684e606e8c54/core/connection.js#L140
  const originalGetFirstStatementConnection = ScratchBlocks.Block.prototype.getFirstStatementConnection;
  ScratchBlocks.Block.prototype.getFirstStatementConnection = function () {
    if (!addon.self.disabled && inInsertionMarkerUpdate && getBlockDraggingGesture() && modifierHeld) {
      return null;
    }

    return originalGetFirstStatementConnection.call(this);
  };

  // To reduce possible breakage, the getFirstStatementConnection trap only applies when we're inside
  // of insertion marker manager code as getFirstStatementConnection is used in other places.
  const originalInsertionMarkerUpdate = ScratchBlocks.InsertionMarkerManager.prototype.update;
  ScratchBlocks.InsertionMarkerManager.prototype.update = function (...args) {
    try {
      inInsertionMarkerUpdate = true;
      return originalInsertionMarkerUpdate.apply(this, args);
    } finally {
      inInsertionMarkerUpdate = false;
    }
  };

  // If the user is still holding the modifier when they release the block, we want to preventDefault()
  // once they release the modifier key.
  const originalEndBlockDrag = ScratchBlocks.BlockDragger.prototype.endBlockDrag;
  ScratchBlocks.BlockDragger.prototype.endBlockDrag = function (...args) {
    if (modifierHeld) {
      disableNextModifierRelease = true;
    }
    return originalEndBlockDrag.apply(this, args);
  };

  const oldGetStartRadius = ScratchBlocks.InsertionMarkerManager.prototype.getStartRadius_;
  ScratchBlocks.InsertionMarkerManager.prototype.getStartRadius_ = function () {
    if (overrideStartRadius > 0) {
      return overrideStartRadius;
    }
    return oldGetStartRadius.call(this);
  };

  addon.settings.addEventListener("change", () => {
    modifierHeld = false;
    disableNextModifierRelease = false;
    if (getBlockDraggingGesture()) {
      forceUpdateDragPreview();
    }
  });
}
