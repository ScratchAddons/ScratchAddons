export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const redux = addon.tab.redux;

  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener("mouseup", ({ clientX, clientY }) => {
    mouseX = clientX;
    mouseY = clientY;
  });

  const originalShareBlocksToTarget = vm.shareBlocksToTarget;
  vm.shareBlocksToTarget = function (blocks, targetId, _) {
    // Based on https://github.com/scratchfoundation/scratch-gui/blob/8be51d2239ae4e741d34f1906372b481f4246dce/src/containers/target-pane.jsx#L164

    const workspace = addon.tab.traps.getWorkspace();

    // Fall back to original function if: addon is disabled or target ID mismatches or Workspace/Redux are unavailable
    if (addon.self.disabled || vm.editingTarget.id !== targetId || !redux.state?.scratchGui || !workspace)
      return originalShareBlocksToTarget.apply(this, arguments);

    const BLOCKS_DEFAULT_SCALE = 0.675; // would be better if we could get this from lib/layout-constants.js
    const { targets } = redux.state.scratchGui.workspaceMetrics;
    const { isRtl } = redux.state.locales;
    const { left, right } = workspace.scrollbar.hScroll.outerSvg_.getBoundingClientRect();
    const { top } = workspace.scrollbar.vScroll.outerSvg_.getBoundingClientRect();

    const insideWorkspace = isRtl ? mouseX > left : mouseX < right;
    const topBlock = blocks.find((block) => block.topLevel);
    if (topBlock && insideWorkspace) {
      const { scrollX = 0, scrollY = 0, scale = BLOCKS_DEFAULT_SCALE } = targets[targetId] || {};
      topBlock.x = (isRtl ? scrollX - mouseX + right : -scrollX + mouseX - left) / scale;
      topBlock.y = (-scrollY - top + mouseY) / scale;
    }

    return originalShareBlocksToTarget.apply(this, arguments);
  };
}
