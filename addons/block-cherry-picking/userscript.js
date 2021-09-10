export default async function ({ addon, global, console }) {
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalObject = BlocklyInstance.Block.prototype.unplug;
  let invertDrag = addon.settings.get("invertDrag");

  // Necessary to detect the CTRL/CMD key
  let ctrlKeyPressed = false;
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey) {
      ctrlKeyPressed = true;
    }
  });
  document.addEventListener("keyup", function (e) {
    if (!e.ctrlKey) {
      ctrlKeyPressed = false;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey) {
      ctrlKeyPressed = true;
    }
  });
  document.addEventListener("keyup", function (e) {
    if (!e.metaKey) {
      ctrlKeyPressed = false;
    }
  });

  // `opt_healStack` is a built-in option in scratch-blocks that enables cherry-picking behavior.
  // All this function does is enable that built-in option for every block.
  BlocklyInstance.BlockSvg.prototype.unplug = function (opt_healStack) {
    if (ctrlKeyPressed != invertDrag) {
      opt_healStack = true;
    }
    return originalObject.call(this, opt_healStack);
  };

  addon.settings.addEventListener("change", function () {
    invertDrag = addon.settings.get("invertDrag");
  });
}