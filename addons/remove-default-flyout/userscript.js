export default async function ({ addon, msg, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const oldSetValue = ScratchBlocks.Field.prototype.setValue;
  ScratchBlocks.Field.prototype.setValue = function (newValue) {
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
    // todo, idk how to do this :(
  }
}
