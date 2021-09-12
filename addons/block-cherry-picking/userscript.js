export default async function ({ addon, global, console }) {
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalObject = BlocklyInstance.Block.prototype.unplug;

  // Necessary to detect the CTRL/CMD key
  let ctrlKeyPressed = false;
  document.addEventListener("keydown", function (e) {
    ctrlKeyPressed = e.ctrlKey || e.metaKey;
  });
  document.addEventListener("keyup", function (e) {
    ctrlKeyPressed = e.ctrlKey || e.metaKey;
  });

  // `opt_healStack` is a built-in option in scratch-blocks that enables cherry-picking behavior.
  // All this function does is enable that built-in option for every block.
  BlocklyInstance.BlockSvg.prototype.unplug = function (opt_healStack) {
    if (ctrlKeyPressed !== addon.settings.get("invertDrag") && !addon.self.disabled) {
      opt_healStack = true;
    }
    return originalObject.call(this, opt_healStack);
  };
}
