export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/2e3a31e/core/field_number.js#L165
  // https://github.com/scratchfoundation/scratch-blocks/blob/638ee0f/src/fields/field_number.js#L135
  let FieldNumber;
  if (ScratchBlocks.registry) {
    // new Blockly
    FieldNumber = ScratchBlocks.registry.getClass(ScratchBlocks.registry.Type.FIELD, "field_number");
  } else {
    FieldNumber = ScratchBlocks.FieldNumber;
  }
  const originalMouseDown = FieldNumber.prototype.showEditor_;
  FieldNumber.prototype.showEditor_ = function (e) {
    if (!addon.self.disabled) {
      this.useTouchInteraction_ = true;
      if (typeof e !== "undefined") {
        e = new PointerEvent(e.type, { ...e, pointerType: "touch" });
      }
    }
    return originalMouseDown.call(this, e);
  };
}
