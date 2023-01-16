export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalCreateVariable = ScratchBlocks.Variables.createVariable;
  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/variables.js#L277
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
