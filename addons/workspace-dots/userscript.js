export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/RaspberryPiFoundation/blockly/blob/1e002dd/packages/blockly/core/grid.ts#L128
  const oldUpdate = ScratchBlocks.Grid.prototype.update;
  ScratchBlocks.Grid.prototype.update = function (scale) {
    const spacingDivisor = addon.settings.get("spacingDivisor");
    const oldSpacing = this.getSpacing();
    if (!addon.self.disabled) this.spacing /= spacingDivisor;
    oldUpdate.call(this, scale);
    if (!addon.self.disabled) this.spacing = oldSpacing;
  };

  // https://github.com/RaspberryPiFoundation/blockly/blob/1e002dd/packages/blockly/core/grid.ts#L158
  const oldSetLineAttr = ScratchBlocks.Grid.prototype.setLineAttributes;
  ScratchBlocks.Grid.prototype.setLineAttributes = function (line, width, x1, x2, y1, y2) {
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
            if (line === this.line1) return FULL_LENGTH;
            else return NO_LENGTH;
          case "horizontal":
            if (line === this.line2) return FULL_LENGTH;
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
    grid.update(grid.scale);
  }

  updateGrid();

  addon.settings.addEventListener("change", updateGrid);
  addon.self.addEventListener("disabled", updateGrid);
  addon.self.addEventListener("reenabled", updateGrid);
}
