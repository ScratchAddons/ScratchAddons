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
        // A separate field has to be updated to avoid dragging comments attached to blocks underneath this block.
        this.dragIconData_ = this.dragIconData_.filter((i) => i.icon.block_ === this.draggingBlock_);
        // And we also have to make sure Scratch will never try to drag a block on top of itself, which crashes the editor.
        // That can happen when you cherry-pick the top block of a script and drop it where it started.
        this.draggedConnectionManager_.availableConnections_ =
          this.draggedConnectionManager_.initAvailableConnections_();
      }
    }
    return originalStartBlockDrag.call(this, ...args);
  };
}
