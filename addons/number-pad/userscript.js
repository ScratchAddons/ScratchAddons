export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/638ee0f/src/fields/field_number.js#L135
  const FieldNumber = ScratchBlocks.registry.getClass(ScratchBlocks.registry.Type.FIELD, "field_number");
  const originalMouseDown = FieldNumber.prototype.showEditor_;
  FieldNumber.prototype.showEditor_ = function (e) {
    if (!addon.self.disabled) {
      if (typeof e !== "undefined") {
        e = new PointerEvent(e.type, { ...e, pointerType: "touch" });
      }
    }
    return originalMouseDown.call(this, e);
  };
}
