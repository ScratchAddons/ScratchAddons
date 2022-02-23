export default async function (/** @type {typeof UserscriptUtils} */ { addon, global, console }) {
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalBlockMouseDown = BlocklyInstance.BlockSvg.prototype.onMouseDown_;
  const originalFieldMouseDown = BlocklyInstance.Field.prototype.onMouseDown_;

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

  // Because of how Scratch adds event listeners, we might have to redraw if the editor already has something
  const vm = addon.tab.traps.vm;
  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
}
