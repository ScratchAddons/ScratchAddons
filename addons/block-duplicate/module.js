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

  if (ScratchBlocks.registry) {
    // new Blockly: only implement duplication (cherry picking is a vanilla feature)

    const oldUpdateIsDragging = ScratchBlocks.Gesture.prototype.updateIsDragging;
    ScratchBlocks.Gesture.prototype.updateIsDragging = function (e) {
      if (!this.targetBlock) {
        oldUpdateIsDragging.call(this, e);
        return;
      }

      const isDuplicating =
        enableDuplication && e.altKey && !this.flyout && this.targetBlock.type !== "procedures_definition";

      if (isDuplicating) {
        this.startWorkspace_.setResizesEnabled(false);
        ScratchBlocks.Events.disable();
        let newBlock;
        try {
          const xmlBlock = ScratchBlocks.Xml.blockToDom(this.targetBlock);
          newBlock = ScratchBlocks.Xml.domToBlock(xmlBlock, this.startWorkspace_);
          const xy = this.targetBlock.getRelativeToSurfaceXY();
          newBlock.moveBy(xy.x, xy.y);
        } catch (e) {
          console.error(e);
        }
        ScratchBlocks.Events.enable();
        this.startWorkspace_.setResizesEnabled(true);

        if (newBlock) {
          if (ScratchBlocks.Events.isEnabled()) {
            ScratchBlocks.Events.setGroup(true);
            // setGroup(false) will be called in endDrag() (overridden below)
            ScratchBlocks.Events.fire(new (ScratchBlocks.Events.get(ScratchBlocks.Events.BLOCK_CREATE))(newBlock));
          }
          const isCherryPickingInverted = invertCherryPicking && this.targetBlock.getParent();
          if ((e.ctrlKey || e.metaKey) === !isCherryPickingInverted) {
            // Holding both Ctrl/Cmd and Alt -> duplicate a single block
            const nextBlock = newBlock.getNextBlock();
            if (nextBlock) {
              nextBlock.dispose();
            }
          }
          this.targetBlock = newBlock;
          ScratchBlocks.common.setSelected(newBlock);
          newBlock.dragStrategy.saIsDuplicating = true;
        }
      }

      oldUpdateIsDragging.call(this, e);
    };

    const oldStartDrag = ScratchBlocks.dragging.BlockDragStrategy.prototype.startDrag;
    ScratchBlocks.dragging.BlockDragStrategy.prototype.startDrag = function (e) {
      if (this.block.isShadow()) {
        oldStartDrag.call(this, e);
        return;
      }

      if (enableDuplication) {
        // By default, both Ctrl/Cmd and Alt can be used for cherry picking.
        // Exclude Alt if duplication is enabled.
        Object.defineProperty(e, "altKey", { value: false });
      }

      const isDuplicating = this.saIsDuplicating;
      delete this.saIsDuplicating;
      const isCherryPickingInverted = invertCherryPicking && (isDuplicating || this.block.getParent());
      if (isCherryPickingInverted) {
        const modifierKeyPressed = e.ctrlKey || e.metaKey || e.altKey;
        Object.defineProperty(e, "ctrlKey", { value: !modifierKeyPressed });
        Object.defineProperty(e, "metaKey", { value: !modifierKeyPressed });
        if (!enableDuplication) Object.defineProperty(e, "altKey", { value: !modifierKeyPressed });
      }

      oldStartDrag.call(this, e);
    };

    const oldEndDrag = ScratchBlocks.dragging.BlockDragStrategy.prototype.endDrag;
    ScratchBlocks.dragging.BlockDragStrategy.prototype.endDrag = function (e) {
      oldEndDrag.call(this, e);
      ScratchBlocks.Events.setGroup(false);
    };

    return;
  }

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
