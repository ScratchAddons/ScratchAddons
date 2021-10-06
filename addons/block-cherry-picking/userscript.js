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

  // https://github.com/LLK/scratch-blocks/blob/102b33d14b25400c064e9bf6924a7ae1b0dcb2ab/core/block_dragger.js#L160
  const originalStartBlockDrag = ScratchBlocks.BlockDragger.prototype.startBlockDrag;
  ScratchBlocks.BlockDragger.prototype.startBlockDrag = function (...args) {
    if (!addon.self.disabled) {
      const invert = addon.settings.get("invertDrag") && this.draggingBlock_.getParent();
      if (ctrlKeyPressed === !invert) {
        if (!ScratchBlocks.Events.getGroup()) {
          ScratchBlocks.Events.setGroup(true);
        }
        this.draggingBlock_.unplug(true);
      }
    }
    return originalStartBlockDrag.call(this, ...args);
  };
}
