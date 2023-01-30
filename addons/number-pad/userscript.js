export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/LLK/scratch-blocks/blob/develop/core/field_number.js#L165
  const originalMouseDown = ScratchBlocks.FieldNumber.prototype.showEditor_;
  ScratchBlocks.FieldNumber.prototype.showEditor_ = function (...args) {
    if (!addon.self.disabled) {
      this.useTouchInteraction_ = true;
    }
    return originalMouseDown.apply(this, args);
  };
}
