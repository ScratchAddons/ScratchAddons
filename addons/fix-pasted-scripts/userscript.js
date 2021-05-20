// This addon works by modifying the VM and Blockly to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalObject = BlocklyInstance.BlockSvg.prototype.onMouseDown_;

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
    if (!addon.self.disabled && this.workspace && this.workspace.isDragging()) {
      return;
    } else {
      return originalObject.call(this, e);
    }
  };

  // Limits all script running, based on setting
  const newBlocklyListen = function (e) {
    var runMode = addon.settings.get("runMode");
    if (!addon.self.disabled && e.element === "stackclick" && runMode == "ctrl" && !ctrlKeyPressed) {
      return;
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
