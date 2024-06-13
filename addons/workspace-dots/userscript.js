export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  const oldFunction = blockly.getMainWorkspace().grid_.update;

  function updateGrid() {
    let themeSetting = addon.settings.get("theme");
    let spacingSetting = addon.settings.get("useSpacing");
    let spacingAmount = addon.settings.get("spacing");

    blockly.getMainWorkspace().grid_.update = function (scale) {
      console.log(themeSetting, spacingSetting, spacingAmount);

      this.scale_ = scale;

      let spacing = this.spacing_;
      if (spacingSetting) spacing = spacingAmount;

      // MSIE freaks if it sees a 0x0 pattern, so set empty patterns to 100x100.
      var safeSpacing = spacing * scale || 100;

      this.gridPattern_.setAttribute("width", safeSpacing);
      this.gridPattern_.setAttribute("height", safeSpacing);

      var half = Math.floor(spacing / 2) + 0.5;
      var start = half - this.length_ / 2;
      var end = half + this.length_ / 2;

      half *= scale;
      start *= scale;
      end *= scale;

      let strokeWidthY;
      let strokeWidthX;

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

      this.setLineAttributes_(this.line1_, strokeWidthY, start, end, half, half);
      this.setLineAttributes_(this.line2_, strokeWidthX, half, half, start, end);
    };

    blockly.getMainWorkspace().grid_.update(blockly.getMainWorkspace().grid_.scale_);
  }

  updateGrid();

  addon.settings.addEventListener("change", updateGrid);

  addon.self.addEventListener("disabled", () => {
    blockly.getMainWorkspace().grid_.update = oldFunction;
    blockly.getMainWorkspace().grid_.update(blockly.getMainWorkspace().grid_.scale_);
  });
  addon.self.addEventListener("reenabled", () => {
    updateGrid.call(this);
  });
}
