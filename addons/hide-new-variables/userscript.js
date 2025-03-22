export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  if (ScratchBlocks.registry) {
    // new Blockly
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
    return;
  }

  const originalCreateVariable = ScratchBlocks.Variables.createVariable;
  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/variables.js#L277
  ScratchBlocks.Variables.createVariable = function (workspace, opt_callback, opt_type) {
    if (!addon.self.disabled) {
      const originalCallback = opt_callback;
      opt_callback = (variableBlockId) => {
        if (variableBlockId) {
          const flyout = workspace.isFlyout ? workspace : workspace.getFlyout();
          if (flyout.setCheckboxState) {
            flyout.setCheckboxState(variableBlockId, false);
          }
        }

        if (originalCallback) {
          originalCallback(variableBlockId);
        }
      };
    }
    return originalCreateVariable.call(this, workspace, opt_callback, opt_type);
  };
}
