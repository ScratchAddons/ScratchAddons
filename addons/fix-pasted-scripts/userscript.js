// This addon works by modifying scratch-blocks to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const BlocklyInstance = await addon.tab.traps.getBlockly();
  const originalObject = BlocklyInstance.BlockSvg.prototype.onMouseDown_;
  var fullDisable = addon.settings.get("fullDisable");

  BlocklyInstance.BlockSvg.prototype.onMouseDown_ = function (e) {
    if (!addon.self.disabled && (fullDisable || (this.workspace && this.workspace.isDragging()))) {
      return
    } else {
      return originalObject.call(this, e);
    }
  };

  // When the setting is toggled, update the variable that contains it
  addon.settings.addEventListener("change", function () {
    fullDisable = addon.settings.get("fullDisable");
  });
}
