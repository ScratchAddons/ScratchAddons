export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/grid.js#L136
  const oldUpdate = ScratchBlocks.Grid.prototype.update;
  ScratchBlocks.Grid.prototype.update = function (scale) {
    const spacingDivisor = addon.settings.get("spacingDivisor");
    const oldSpacing = this.getSpacing();
    if (!addon.self.disabled) {
      if (ScratchBlocks.registry)
        this.spacing /= spacingDivisor; // new Blockly
      else this.spacing_ /= spacingDivisor;
    }
    oldUpdate.call(this, scale);
    if (!addon.self.disabled) {
      if (ScratchBlocks.registry)
        this.spacing = oldSpacing; // new Blockly
      else this.spacing_ = oldSpacing;
    }
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/grid.js#L167
  let setLineAttrMethodName;
  if (ScratchBlocks.registry)
    setLineAttrMethodName = "setLineAttributes"; // new Blockly
  else setLineAttrMethodName = "setLineAttributes_";
  const oldSetLineAttr = ScratchBlocks.Grid.prototype[setLineAttrMethodName];
  ScratchBlocks.Grid.prototype[setLineAttrMethodName] = function (line, width, x1, x2, y1, y2) {
    if (!addon.self.disabled) {
      const DOT_LENGTH = 1;
      const FULL_LENGTH = this.getSpacing() + 1;
      const CROSSHAIR_LENGTH = this.getSpacing() / 2.5;
      const NO_LENGTH = 0;

      // We are mulitplying line1's (vertical line) and line2's (horizontal line)'s length based on the user's setting.
      // Scratch calls it "width", so don't get confused.
      width *= (() => {
        switch (addon.settings.get("theme")) {
          case "lines":
            return FULL_LENGTH;
          case "crosshairs":
            return CROSSHAIR_LENGTH;
          case "none":
            return NO_LENGTH;
          case "vertical":
            if (line === this.line1 || line === this.line1_) return FULL_LENGTH;
            else return NO_LENGTH;
          case "horizontal":
            if (line === this.line2 || line === this.line2_) return FULL_LENGTH;
            else return NO_LENGTH;
          case "dots":
          default:
            return DOT_LENGTH;
        }
      })();
    }
    oldSetLineAttr.call(this, line, width, x1, x2, y1, y2);
  };

  function updateGrid() {
    const workspace = addon.tab.traps.getWorkspace();
    const grid = workspace.getGrid();
    if (ScratchBlocks.registry)
      grid.update(grid.scale); // new Blockly
    else grid.update(grid.scale_);
  }

  updateGrid();

  addon.settings.addEventListener("change", updateGrid);
  addon.self.addEventListener("disabled", updateGrid);
  addon.self.addEventListener("reenabled", updateGrid);
}
