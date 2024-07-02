import { updateAllBlocks } from "../custom-block-shape/update-all-blocks.js";

export default async function ({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const opcodeToSettings = {
    text: "text",
    argument_editor_string_number: "text",
    math_number: "number",
    math_integer: "number",
    math_whole_number: "number",
    math_positive_number: "number",
    math_angle: "number",
    note: "number",
    colour_picker: "color",
  };

  const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;

  ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
    if (!addon.self.disabled && opcodeToSettings[this.type] && addon.settings.get(opcodeToSettings[this.type])) {
      originalJsonInit.call(this, {
        ...json,
        outputShape: ScratchBlocks.OUTPUT_SHAPE_SQUARE,
      });
    } else {
      originalJsonInit.call(this, json);
    }
  };

  function update() {
    updateAllBlocks(vm, addon.tab.traps.getWorkspace(), ScratchBlocks);
  }

  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  addon.settings.addEventListener("change", update);
  update();
}
