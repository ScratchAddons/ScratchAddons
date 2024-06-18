export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();
  window.blockly = blockly;

  const workspace = blockly.getMainWorkspace();

  // https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/grid.js#L136
  workspace.grid_.update = function (scale) {
    let themeSetting = addon.settings.get("theme");
    let spacingSetting = addon.settings.get("useSpacing");
    let spacingAmount = addon.settings.get("spacing");

    this.scale_ = scale;

    let spacing = this.spacing_;
    if (spacingSetting & !addon.self.disabled) spacing = spacingAmount;

    // MSIE freaks if it sees a 0x0 pattern, so set empty patterns to 100x100.
    let safeSpacing = spacing * scale || 100;

    this.gridPattern_.setAttribute("width", safeSpacing);
    this.gridPattern_.setAttribute("height", safeSpacing);

    let half = Math.floor(spacing / 2) + 0.5;
    let start = half - this.length_ / 2;
    let end = half + this.length_ / 2;

    half *= scale;
    start *= scale;
    end *= scale;

    let strokeWidthY;
    let strokeWidthX;

    if (!addon.self.disabled) {
      switch (themeSetting) {
        case "dots":
          strokeWidthY = scale;
          strokeWidthX = scale;
          break;
        case "lines":
          strokeWidthX = scale * (spacing + 1);
          strokeWidthY = scale * (spacing + 1);
          break;
        case "crosshairs":
          strokeWidthX = scale * 15;
          strokeWidthY = scale * 15;
          break;
        case "none":
          strokeWidthX = 0;
          strokeWidthY = 0;
          break;
        case "vertical":
          strokeWidthX = 0;
          strokeWidthY = scale * (spacing + 1);
          break;
        case "horizontal":
          strokeWidthX = scale * (spacing + 1);
          strokeWidthY = 0;
          break;
      }
    } else {
      strokeWidthY = scale;
      strokeWidthX = scale;
    }

    this.setLineAttributes_(this.line1_, strokeWidthY, start, end, half, half);
    this.setLineAttributes_(this.line2_, strokeWidthX, half, half, start, end);
  };

  function updateGrid() {
    workspace.grid_.update(workspace.grid_.scale_);
  }

  updateGrid();

  addon.settings.addEventListener("change", updateGrid);
  addon.self.addEventListener("disabled", updateGrid);
  addon.self.addEventListener("reenabled", updateGrid);
}
