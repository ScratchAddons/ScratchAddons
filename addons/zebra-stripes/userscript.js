export default async function ({ addon, msg, global, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  function stripeBlock() {
    if (this.isShadow()) return;
    if (addon.self.disabled) {
      if (this.stripe) {
        this.stripe = false;
        this.setColour(
          Blockly.Colours[this.getCategory()].primary,
          Blockly.Colours[this.getCategory()].secondary,
          Blockly.Colours[this.getCategory()].tertiary
        );
      }
      return;
    }

    let parent = this.getSurroundParent();
    if (parent) {
      if (!parent.stripe) {
        if (!parent.getOutputShape() && this.getOutputShape()) return;
        this.setColour(
          shadeColor(Blockly.Colours[this.getCategory()].primary, 50),
          shadeColor(Blockly.Colours[this.getCategory()].secondary, 50),
          shadeColor(Blockly.Colours[this.getCategory()].tertiary, 50)
        );
        this.stripe = true;
      } else {
        this.stripe = false;
        this.setColour(
          Blockly.Colours[this.getCategory()].primary,
          Blockly.Colours[this.getCategory()].secondary,
          Blockly.Colours[this.getCategory()].tertiary
        );
      }
    } else {
      this.stripe = false;
      this.setColour(
        Blockly.Colours[this.getCategory()].primary,
        Blockly.Colours[this.getCategory()].secondary,
        Blockly.Colours[this.getCategory()].tertiary
      );
    }

    function shadeColor(col, amt) {
      var usePound = false;
      if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
      }
      var num = parseInt(col, 16);
      var r = (num >> 16) + amt;
      if (r > 255) r = 255;
      else if (r < 0) r = 0;
      var b = ((num >> 8) & 0x00ff) + amt;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;
      var g = (num & 0x0000ff) + amt;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
      return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
    }
  }

  Blockly.Blocks.control_forever.onchange = stripeBlock;
  Blockly.Blocks.control_repeat.onchange = stripeBlock;
  Blockly.Blocks.control_if.onchange = stripeBlock;
  Blockly.Blocks.control_if_else.onchange = stripeBlock;
  Blockly.Blocks.control_repeat_until.onchange = stripeBlock;
  Blockly.Extensions.ALL_.output_number = function () {
    this.setInputsInline(true);
    this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
    this.setOutput(true, "Number");
    this.onchange = stripeBlock;
  };
  Blockly.Extensions.ALL_.output_string = function () {
    this.setInputsInline(true);
    this.setOutputShape(Blockly.OUTPUT_SHAPE_ROUND);
    this.setOutput(true, "String");
    this.onchange = stripeBlock;
  };
  Blockly.Extensions.ALL_.output_boolean = function () {
    this.setInputsInline(true);
    this.setOutputShape(Blockly.OUTPUT_SHAPE_HEXAGONAL);
    this.setOutput(true, "Boolean");
    this.onchange = stripeBlock;
  };

  // If editingTarget is set, the editor has already rendered and we have to tell it to rerender.
  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
  addon.self.addEventListener("disabled", () => {
    vm.emitWorkspaceUpdate();
  });
}
