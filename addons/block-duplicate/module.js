let enableCherryPicking = false;
let invertCherryPicking = false;
export function setCherryPicking(newEnabled, newInverted) {
  enableCherryPicking = newEnabled;
  // If cherry picking is disabled, also disable invert. Duplicating blocks can still cause
  // this setting to be used.
  invertCherryPicking = newEnabled && newInverted;
}

let enableDuplication = false;
export function setDuplication(newEnabled) {
  enableDuplication = newEnabled;
}

// mostRecentEvent_ is sometimes a fake event, so we can't rely on reading its properties.
let ctrlOrMetaPressed = false;
let altPressed = false;
document.addEventListener(
  "mousedown",
  function (e) {
    ctrlOrMetaPressed = e.ctrlKey || e.metaKey;
    altPressed = e.altKey;
  },
  {
    capture: true,
  }
);

let loaded = false;

export async function load(addon) {
  if (loaded) {
    return;
  }
  loaded = true;

  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/912b8cc728bea8fd91af85078c64fcdbfe21c87a/core/gesture.js#L454
  const originalStartDraggingBlock = ScratchBlocks.Gesture.prototype.startDraggingBlock_;
  ScratchBlocks.Gesture.prototype.startDraggingBlock_ = function (...args) {
    let block = this.targetBlock_;

    // Scratch uses fake mouse events to implement right click > duplicate
    const isRightClickDuplicate = !(this.mostRecentEvent_ instanceof MouseEvent);

    const isDuplicating =
      enableDuplication &&
      altPressed &&
      !isRightClickDuplicate &&
      !this.flyout_ &&
      !this.shouldDuplicateOnDrag_ &&
      this.targetBlock_.type !== "procedures_definition";

    const isCherryPickingInverted = invertCherryPicking && !isRightClickDuplicate && block.getParent();
    const canCherryPick = enableCherryPicking || isDuplicating;
    const isCherryPicking = canCherryPick && ctrlOrMetaPressed === !isCherryPickingInverted && !block.isShadow();

    if (isDuplicating || isCherryPicking) {
      if (!ScratchBlocks.Events.getGroup()) {
        // Scratch will disable grouping on its own later.
        ScratchBlocks.Events.setGroup(true);
      }
    }

    if (isDuplicating) {
      // Based on https://github.com/scratchfoundation/scratch-blocks/blob/feda366947432b9d82a4f212f43ff6d4ab6f252f/core/scratch_blocks_utils.js#L171
      // Setting this.shouldDuplicateOnDrag_ = true does NOT work because it doesn't call changeObscuredShadowIds
      this.startWorkspace_.setResizesEnabled(false);
      ScratchBlocks.Events.disable();
      let newBlock;
      try {
        const xmlBlock = ScratchBlocks.Xml.blockToDom(block);
        newBlock = ScratchBlocks.Xml.domToBlock(xmlBlock, this.startWorkspace_);
        ScratchBlocks.scratchBlocksUtils.changeObscuredShadowIds(newBlock);
        const xy = block.getRelativeToSurfaceXY();
        newBlock.moveBy(xy.x, xy.y);
      } catch (e) {
        console.error(e);
      }
      ScratchBlocks.Events.enable();

      if (newBlock) {
        block = newBlock;
        this.targetBlock_ = newBlock;
        if (ScratchBlocks.Events.isEnabled()) {
          ScratchBlocks.Events.fire(new ScratchBlocks.Events.BlockCreate(newBlock));
        }
      }
    }

    if (isCherryPicking) {
      if (isRightClickDuplicate || isDuplicating) {
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          nextBlock.dispose();
        }
      }
      block.unplug(true);
    }

    return originalStartDraggingBlock.call(this, ...args);
  };
}
