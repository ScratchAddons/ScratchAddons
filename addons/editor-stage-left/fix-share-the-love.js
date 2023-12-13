export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const resize = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) window.dispatchEvent(new Event("resize"));
  };
  addon.self.addEventListener("disabled", resize);
  addon.self.addEventListener("reenabled", resize);
  const originalGetClientRect = ScratchBlocks.VerticalFlyout.prototype.getClientRect;
  ScratchBlocks.VerticalFlyout.prototype.getClientRect = function () {
    const rect = originalGetClientRect.call(this);
    if (!rect || addon.self.disabled) return rect;
    // undo the effect of BIG_NUM in https://github.com/scratchfoundation/scratch-blocks/blob/ab26fa2960643fa38fbc7b91ca2956be66055070/core/flyout_vertical.js#L739
    if (this.toolboxPosition_ === ScratchBlocks.TOOLBOX_AT_LEFT) {
      rect.left += 1000000000;
    }
    rect.width -= 1000000000;
    return rect;
  };
  if (addon.self.enabledLate) resize();
}
