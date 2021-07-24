export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const updateAreas = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) workspace.recordCachedAreas();
  };
  addon.self.addEventListener("disabled", updateAreas);
  addon.self.addEventListener("reenabled", updateAreas);
  const originalGetClientRect = ScratchBlocks.Toolbox.prototype.getClientRect;
  ScratchBlocks.Toolbox.prototype.getClientRect = function () {
    // we are trying to undo the effect of BIG_NUM in https://github.com/LLK/scratch-blocks/blob/ab26fa2960643fa38fbc7b91ca2956be66055070/core/flyout_vertical.js#L739
    const rect = originalGetClientRect.call(this);
    if (!rect || addon.self.disabled) return rect;
    rect.left += 1000000000;
    rect.width -= 1000000000;
    return rect;
  };
}
