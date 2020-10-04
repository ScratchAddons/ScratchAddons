export default function ({ addon, global, console }) {
  const inject = () => {
    const workspace = addon.tab.traps.onceValues.workspace;
    const originalGetClientRect = workspace.toolbox_.getClientRect;
    workspace.toolbox_.getClientRect = function () {
      // we are trying to undo the effect of BIG_NUM in https://github.com/LLK/scratch-blocks/blob/ab26fa2960643fa38fbc7b91ca2956be66055070/core/flyout_vertical.js#L739
      const rect = originalGetClientRect.call(this);
      if (!rect) return rect;
      if (rect.left > 0) return rect;
      rect.left += 1000000000;
      rect.width -= 1000000000;
      return rect;
    };
  };

  if (addon.tab.traps.onceValues.workspace) inject();
  else addon.tab.traps.addOnceListener("workspace", inject);
}
