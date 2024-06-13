export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const oldFunction = ScratchBlocks.Block.prototype.getFirstStatementConnection;
  const settingsToKey = {
    ctrl: "Control",
    alt: "Alt Meta",
    shift: "Shift",
  };

  let modifierHeld = false;

  function keyDown(e, key) {
    if (settingsToKey[key].includes(e.key)) {
      modifierHeld = true;
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
  }

  function keyUp(e, key) {
    if (settingsToKey[key].includes(e.key)) {
      modifierHeld = false;
    }
  }

  let currentKey;
  const keyDownListener = (e) => keyDown(e, currentKey);
  const keyUpListener = (e) => keyUp(e, currentKey);

  function addEventListeners(key) {
    currentKey = key;
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);
  }

  function removeEventListeners() {
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("keyup", keyUpListener);
  }

  function polluteFunction() {
    ScratchBlocks.Block.prototype.getFirstStatementConnection = function () {
      if (modifierHeld) return null;

      for (var i = 0, input; (input = this.inputList[i]); i++) {
        if (input.connection && input.connection.type == ScratchBlocks.NEXT_STATEMENT) {
          return input.connection;
        }
      }
      return null;
    };
  }

  polluteFunction();
  addEventListeners(addon.settings.get("key"));

  addon.self.addEventListener(
    "disabled",
    () => (ScratchBlocks.Block.prototype.getFirstStatementConnection = oldFunction)
  );
  addon.self.addEventListener("reenabled", () => {
    polluteFunction();
    removeEventListeners();
    addEventListeners(addon.settings.get("key"));
  });

  addon.settings.addEventListener("change", () => {
    removeEventListeners();
    addEventListeners(addon.settings.get("key"));
  });
}
