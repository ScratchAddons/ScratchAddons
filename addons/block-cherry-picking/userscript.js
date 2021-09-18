export default async function ({ addon, global, console }) {
  const BlocklyInstance = await addon.tab.traps.getBlockly();

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
  let isInStartBlockDrag = false;
  const originalStartBlockDrag = BlocklyInstance.BlockDragger.prototype.startBlockDrag;
  BlocklyInstance.BlockDragger.prototype.startBlockDrag = function (...args) {
    isInStartBlockDrag = true;
    try {
      return originalStartBlockDrag.call(this, ...args);
    } finally {
      isInStartBlockDrag = false;
    }
  };

  // `opt_healStack` is a built-in option in scratch-blocks that enables cherry-picking behavior.
  // All this function does is enable that built-in option for every block.
  // https://github.com/LLK/scratch-blocks/blob/102b33d14b25400c064e9bf6924a7ae1b0dcb2ab/core/block.js#L336
  const originalUnplug = BlocklyInstance.Block.prototype.unplug;
  BlocklyInstance.BlockSvg.prototype.unplug = function (opt_healStack) {
    if (isInStartBlockDrag && ctrlKeyPressed !== addon.settings.get("invertDrag") && !addon.self.disabled) {
      opt_healStack = true;
    }
    return originalUnplug.call(this, opt_healStack);
  };
}
