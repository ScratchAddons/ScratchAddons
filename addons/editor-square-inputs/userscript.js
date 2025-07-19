import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

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

  let SQUARE;
  let CORNER_RADIUS;
  if (ScratchBlocks.registry) {
    // new Blockly
    const constants = new ScratchBlocks.zelos.ConstantProvider();
    SQUARE = constants.SHAPES.SQUARE;
    CORNER_RADIUS = constants.CORNER_RADIUS;
  } else {
    SQUARE = ScratchBlocks.OUTPUT_SHAPE_SQUARE;
  }

  const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;

  ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
    if (!addon.self.disabled && opcodeToSettings[this.type] && addon.settings.get(opcodeToSettings[this.type])) {
      originalJsonInit.call(this, {
        ...json,
        outputShape: SQUARE,
      });
    } else {
      originalJsonInit.call(this, json);
    }
  };

  if (ScratchBlocks.registry) {
    // new Blockly

    const originalFieldTextInputWidgetCreate = ScratchBlocks.FieldTextInput.prototype.widgetCreate_;
    ScratchBlocks.FieldTextInput.prototype.widgetCreate_ = function () {
      const htmlInput = originalFieldTextInputWidgetCreate.call(this);
      if (!addon.self.disabled && this.isFullBlockField() && this.getSourceBlock().getOutputShape() === SQUARE) {
        // Change border radius of HTML input
        const div = ScratchBlocks.WidgetDiv.getDiv();
        const scale = this.workspace_.getAbsoluteScale();
        const borderRadius = `${CORNER_RADIUS * scale}px`;
        div.style.borderRadius = borderRadius;
        htmlInput.style.borderRadius = borderRadius;
      }
      return htmlInput;
    };

    const originalFinalizeHorizontalAlignment = ScratchBlocks.zelos.RenderInfo.prototype.finalizeHorizontalAlignment_;
    ScratchBlocks.zelos.RenderInfo.prototype.finalizeHorizontalAlignment_ = function () {
      // Increase minimum width of square inputs
      const oldMinBlockWidth = this.constants_.MIN_BLOCK_WIDTH;
      if (!addon.self.disabled && this.block_.getOutputShape() === SQUARE) {
        this.constants_.MIN_BLOCK_WIDTH = 6 * this.constants_.GRID_UNIT;
      }
      originalFinalizeHorizontalAlignment.call(this);
      this.constants_.MIN_BLOCK_WIDTH = oldMinBlockWidth;
    };
  }

  function update() {
    updateAllBlocks(addon.tab);
  }

  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  addon.settings.addEventListener("change", update);
  update();
}
