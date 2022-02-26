export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalGetGesture = ScratchBlocks.WorkspaceSvg.prototype.getGesture;
  ScratchBlocks.WorkspaceSvg.prototype.getGesture = function (e) {
    if (!addon.self.disabled && e.type === "mousedown" && this.isDragging()) {
      return null;
    }
    return originalGetGesture.call(this, e);
  };
}
