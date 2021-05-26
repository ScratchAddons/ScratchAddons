// This addon works by modifying the VM and Blockly to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalBlockMouseDown = BlocklyInstance.BlockSvg.prototype.onMouseDown_;
  const originalFieldMouseDown = BlocklyInstance.Field.prototype.onMouseDown_;

  // Fixes the duplicate/pasting bug, no matter the setting (@GarboMuffin's implementation)
  BlocklyInstance.BlockSvg.prototype.onMouseDown_ = function (e) {
    if (!addon.self.disabled && this.workspace && this.workspace.isDragging()) {
      return;
    }
    return originalBlockMouseDown.call(this, e);
  };
  BlocklyInstance.Field.prototype.onMouseDown_ = function (e) {
    if (
      !addon.self.disabled &&
      this.sourceBlock_ &&
      this.sourceBlock_.workspace &&
      this.sourceBlock_.workspace.isDragging()
    ) {
      return;
    }
    return originalFieldMouseDown.call(this, e);
  };

  if (addon.self.enabledLate) vm.emitWorkspaceUpdate();
}
