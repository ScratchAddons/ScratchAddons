export default async function ({ addon, msg, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const oldSetValue = ScratchBlocks.Field.prototype.setValue;
  ScratchBlocks.Field.prototype.setValue = function (newValue) {
    // console.trace();
    if (!addon.self.disabled && this instanceof ScratchBlocks.FieldTextInput && this.sourceBlock_?.isInFlyout) {
      newValue = "";
    }
    oldSetValue.call(this, newValue);
  };

  if (addon.self.enabledLate) {
    updateToolbox();
  }
  addon.self.addEventListener("disabled", updateToolbox);
  addon.self.addEventListener("reenabled", updateToolbox);

  function updateToolbox() {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) return;
    const toolbox = Blockly.getMainWorkspace().getToolbox();
    if (!toolbox) return;
    const flyout = toolbox.flyout_;
    if (!flyout) return;
    console.log("showing and hiding");
    flyout.hide();
    console.log(toolbox);
    // toolbox.showAll_();
  }
}
