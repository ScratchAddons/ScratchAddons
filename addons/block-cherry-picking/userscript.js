export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  let ctrlKeyPressed = false;
  document.addEventListener(
    "mousedown",
    function (e) {
      ctrlKeyPressed = e.ctrlKey || e.metaKey;
    },
    {
      capture: true,
    }
  );

  // https://github.com/LLK/scratch-blocks/blob/912b8cc728bea8fd91af85078c64fcdbfe21c87a/core/gesture.js#L454
  const originalStartDraggingBlock = ScratchBlocks.Gesture.prototype.startDraggingBlock_;
  ScratchBlocks.Gesture.prototype.startDraggingBlock_ = function (...args) {
    if (!addon.self.disabled) {
      // Scratch uses fake mouse events to implement right click > duplicate
      // This has no connection to the block-duplicate addon.
      const isDuplicate = !(this.mostRecentEvent_ instanceof MouseEvent);
      const block = this.targetBlock_;
      const invert = addon.settings.get("invertDrag") && !isDuplicate && block.getParent();
      const isShadow = block.isShadow();
      if (ctrlKeyPressed === !invert && !isShadow) {
        if (!ScratchBlocks.Events.getGroup()) {
          ScratchBlocks.Events.setGroup(true);
        }
        if (isDuplicate) {
          const nextBlock = block.getNextBlock();
          if (nextBlock) {
            nextBlock.dispose();
          }
        }
        block.unplug(true);
      }
    }
    return originalStartDraggingBlock.call(this, ...args);
  };
}
