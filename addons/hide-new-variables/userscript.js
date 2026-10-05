export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // Scratch code that we want to prevent from running:
  // toolbox.runAfterRerender(() => {
  //   flyout.setCheckboxState(variableBlockId, true);
  // });
  // https://github.com/scratchfoundation/scratch-blocks/blob/0f6a3f3/src/variables.ts#L146-L148
  const workspace = addon.tab.traps.getWorkspace();
  const ScratchContinuousToolbox = workspace.getToolbox().constructor;
  const originalRunAfterRerender = ScratchContinuousToolbox.prototype.runAfterRerender;
  ScratchContinuousToolbox.prototype.runAfterRerender = function (callback) {
    if (!addon.self.disabled) {
      const originalCallback = callback;
      const flyout = this.getFlyout();
      callback = () => {
        const originalSetCheckboxState = flyout.setCheckboxState;
        flyout.setCheckboxState = () => {};
        originalCallback();
        flyout.setCheckboxState = originalSetCheckboxState;
      };
    }
    return originalRunAfterRerender.call(this, callback);
  };
}
