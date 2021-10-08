export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalStartDraggingBlock = ScratchBlocks.Gesture.prototype.startDraggingBlock_;
  // https://github.com/LLK/scratch-blocks/blob/e86f115457006d1cde83baa23eaaf1ee16d315f5/core/gesture.js#L454
  ScratchBlocks.Gesture.prototype.startDraggingBlock_ = function (...args) {
    if (
      !this.flyout_ &&
      !this.shouldDuplicateOnDrag_ &&
      this.targetBlock_.type !== "procedures_definition" &&
      this.mostRecentEvent_.altKey &&
      !addon.self.disabled
    ) {
      // Scratch will reset these when the drag ends
      if (!ScratchBlocks.Events.getGroup()) {
        ScratchBlocks.Events.setGroup(true);
      }
      this.startWorkspace_.setResizesEnabled(false);
      // Based on https://github.com/LLK/scratch-blocks/blob/feda366947432b9d82a4f212f43ff6d4ab6f252f/core/scratch_blocks_utils.js#L171
      // Setting this.shouldDuplicateOnDrag_ = true does NOT work because it doesn't call changeObscuredShadowIds
      ScratchBlocks.Events.disable();
      let newBlock;
      try {
        const xmlBlock = ScratchBlocks.Xml.blockToDom(this.targetBlock_);
        newBlock = ScratchBlocks.Xml.domToBlock(xmlBlock, this.startWorkspace_);
        ScratchBlocks.scratchBlocksUtils.changeObscuredShadowIds(newBlock);
        const xy = this.targetBlock_.getRelativeToSurfaceXY();
        newBlock.moveBy(xy.x, xy.y);
        if (this.mostRecentEvent_.ctrlKey || this.mostRecentEvent_.metaKey) {
          const nextBlock = newBlock.getNextBlock();
          if (nextBlock) {
            nextBlock.dispose();
          }
        }
      } catch (e) {
        console.error(e);
      }
      ScratchBlocks.Events.enable();
      if (newBlock) {
        this.targetBlock_ = newBlock;
        if (ScratchBlocks.Events.isEnabled()) {
          ScratchBlocks.Events.fire(new ScratchBlocks.Events.BlockCreate(newBlock));
        }
      }
    }
    return originalStartDraggingBlock.call(this, ...args);
  };
}
