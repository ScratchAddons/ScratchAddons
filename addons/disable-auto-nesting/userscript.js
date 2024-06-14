export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

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
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  const evaluateModifier = (e) => {
    const key = addon.settings.get("key");

    if (key === "ctrl") {
      return e.ctrlKey || e.metaKey;
    } else if (key === "alt") {
      return e.altKey;
    } else if (key === "shift") {
      return e.shiftKey;
    }

    console.error('unknown key', key);
    return false;
  };

  let modifierHeld = false;

  /**
   * @param {KeyboardEvent} e
   */
  const handleKeyEvent = (e) => {
    const newModifier = evaluateModifier(e);
    if (newModifier !== modifierHeld) {
      modifierHeld = newModifier;

      const gesture = getBlockDraggingGesture();
      if (!addon.self.disabled && gesture) {
        // Disable alt from opening menu in Firefox
        // TODO: this doesnt run when someone starts dragging, holds alt, drops, then releases
        e.preventDefault();

        // Reset the current preview
        // https://github.com/scratchfoundation/scratch-blocks/blob/d0701601145ab1185f8684be9112684e606e8c54/core/insertion_marker_manager.js#L520
        const insertionMarkerManager = gesture.blockDragger_.draggedConnectionManager_;
        if (insertionMarkerManager.markerConnection_) {
          ScratchBlocks.Events.disable();
          insertionMarkerManager.hidePreview_();
          ScratchBlocks.Events.enable();
        }
        insertionMarkerManager.markerConnection_ = null;
        insertionMarkerManager.closestConnection_ = null;
        insertionMarkerManager.localConnection_ = null;

        // Display a fresh preview
        const mostRecentEvent = gesture.mostRecentEvent_;
        gesture.handleMove(mostRecentEvent);
      }
    }
  };

  document.addEventListener('keydown', handleKeyEvent);
  document.addEventListener('keyup', handleKeyEvent);

  const originalGetFirstStatementConnection = ScratchBlocks.Block.prototype.getFirstStatementConnection;
  ScratchBlocks.Block.prototype.getFirstStatementConnection = function () {
    if (!addon.self.disabled && getBlockDraggingGesture() && modifierHeld) {
      return null;
    }

    return originalGetFirstStatementConnection.call(this);
  };
}
