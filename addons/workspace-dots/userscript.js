export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/grid.js#L136
  const oldUpdate = ScratchBlocks.Grid.prototype.update;
  ScratchBlocks.Grid.prototype.update = function (scale) {
    const spacingDivisor = addon.settings.get("spacingDivisor");
    const oldSpacing = this.spacing_;
    if (!addon.self.disabled) this.spacing_ /= spacingDivisor;
    oldUpdate.call(this, scale);
    if (!addon.self.disabled) this.spacing_ = oldSpacing;
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/grid.js#L167
  const oldSetLineAttr = ScratchBlocks.Grid.prototype.setLineAttributes_;
  ScratchBlocks.Grid.prototype.setLineAttributes_ = function (line, width, x1, x2, y1, y2) {
    if (!addon.self.disabled) {
      const DOT_LENGTH = 1;
      const FULL_LENGTH = this.spacing_ + 1;
      const CROSSHAIR_LENGTH = this.spacing_ / 2.5;
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
            if (line === this.line1_) return FULL_LENGTH;
            else return NO_LENGTH;
          case "horizontal":
            if (line === this.line2_) return FULL_LENGTH;
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
    grid.update(grid.scale_);
  }

  updateGrid();

  addon.settings.addEventListener("change", updateGrid);
  addon.self.addEventListener("disabled", updateGrid);
  addon.self.addEventListener("reenabled", updateGrid);
}
