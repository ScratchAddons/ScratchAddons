let invertCherryPicking = false;
export function setCherryPicking(newInverted) {
  invertCherryPicking = newInverted;
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

  const oldUpdateIsDragging = ScratchBlocks.Gesture.prototype.updateIsDragging;
  ScratchBlocks.Gesture.prototype.updateIsDragging = function (e) {
    if (!this.targetBlock) {
      oldUpdateIsDragging.call(this, e);
      return;
    }

    const isDuplicating =
      enableDuplication &&
      e.altKey &&
      !this.flyout &&
      this.targetBlock.type !== "procedures_definition" &&
      this.targetBlock.type !== "procedures_prototype";

    if (isDuplicating) {
      this.startWorkspace_.setResizesEnabled(false);
      ScratchBlocks.Events.disable();
      let newBlock;
      try {
        let serializedBlock = ScratchBlocks.serialization.blocks.save(this.targetBlock);
        const stripIdsResult = ScratchBlocks.scratchBlocksUtils.stripIds(serializedBlock);
        if (stripIdsResult) serializedBlock = stripIdsResult;
        newBlock = ScratchBlocks.serialization.blocks.appendInternal(serializedBlock, this.startWorkspace_);
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
}
