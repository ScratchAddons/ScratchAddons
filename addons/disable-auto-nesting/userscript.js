export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  /**
   * @returns {boolean}
   */
  const isDraggingBlock = () => {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) {
      return false;
    }

    const gesture = workspace.currentGesture_;
    if (!gesture) {
      return false;
    }

    return !!gesture.blockDragger_;
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

      // Disable alt from opening menu in Firefox
      if (!addon.self.disabled && isDraggingBlock()) {
        e.preventDefault();
      }
    }

    // const workspace = ScratchBlocks.getMainWorkspace();
    // const gesture = workspace.currentGesture_;

    // console.log(gesture.targetBlock_);

    // const thing = { workspace_: ScratchBlocks.mainWorkspace };
    // console.log(thing.workspace_);

    // ScratchBlocks.InsertionMarkerManager.prototype.update = function (dxy, deleteArea) {
    //   var candidate = this.getCandidate_.call(gesture.targetBlock_, dxy);

    //   this.wouldDeleteBlock_ = this.shouldDelete_(candidate, deleteArea);
    //   var shouldUpdate = this.wouldDeleteBlock_ || this.shouldUpdatePreviews_(candidate, dxy);

    //   if (shouldUpdate) {
    //     // Don't fire events for insertion marker creation or movement.
    //     ScratchBlocks.Events.disable();
    //     this.maybeHidePreview_(candidate);
    //     this.maybeShowPreview_(candidate);
    //     ScratchBlocks.Events.enable();
    //   }
    // };

    // if (gesture !== null) {

    // ****Cannot read properties of undefined (reading 'length') at Blockly.InsertionMarkerManager.getCandidate_****

    //   ScratchBlocks.InsertionMarkerManager.prototype.update(
    //     ScratchBlocks.BlockDragger.prototype.pixelsToWorkspaceUnits_.call(thing, gesture.currentDragDeltaXY_),
    //     1
    //   );
    // }
  };

  document.addEventListener('keydown', handleKeyEvent);
  document.addEventListener('keyup', handleKeyEvent);

  const originalGetFirstStatementConnection = ScratchBlocks.Block.prototype.getFirstStatementConnection;
  ScratchBlocks.Block.prototype.getFirstStatementConnection = function () {
    if (!addon.self.disabled && isDraggingBlock() && modifierHeld) {
      return null;
    }

    return originalGetFirstStatementConnection.call(this);
  };
}
