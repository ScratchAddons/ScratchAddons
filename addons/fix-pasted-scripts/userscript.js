// This addon works by modifying the VM and Blockly to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const vm = await addon.tab.traps.vm;
  const originalBlocklyListen = await vm.editingTarget.blocks.constructor.prototype.blocklyListen;
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalObject = await BlocklyInstance.BlockSvg.prototype.onMouseDown_;

  // Necessary for the CTRL + click option to work
  var ctrlKeyPressed = false;
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

  // Fixes the duplicate/pasting bug, no matter the setting (@GarboMuffin's implementation)
  BlocklyInstance.BlockSvg.prototype.onMouseDown_ = function (e) {
    if (this.workspace && this.workspace.isDragging()) {
      return;
    } else {
      return originalObject.call(this, e);
    }
  };

  // Limits all script running, based on setting
  const newBlocklyListen = function (e) {
    var runMode = addon.settings.get("runMode");
    if (
      !addon.self.disabled &&
      e.element === "stackclick" &&
      (runMode == "fullDisable" || (runMode == "ctrl" && !ctrlKeyPressed))
    ) {
      return;
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
