export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalStartDraggingBlock = ScratchBlocks.Gesture.prototype.startDraggingBlock_;
  // https://github.com/LLK/scratch-blocks/blob/e86f115457006d1cde83baa23eaaf1ee16d315f5/core/gesture.js#L454
  ScratchBlocks.Gesture.prototype.startDraggingBlock_ = function (...args) {
    if (this.mostRecentEvent_.shiftKey && !addon.self.disabled) {
      this.shouldDuplicateOnDrag_ = true;
    }
    return originalStartDraggingBlock.call(this, ...args);
  };
}
