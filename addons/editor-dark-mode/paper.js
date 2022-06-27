import { textColor, multiply, brighten, alphaBlend, makeHsv } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();

  const secondaryColor = () =>
    textColor(
      addon.settings.get("primary"),
      multiply(addon.settings.get("primary"), { r: 0.66, g: 0.76, b: 0.8 }),
      brighten(addon.settings.get("primary"), { r: 0.75, g: 0.75, b: 0.75 }),
      60
    );

  const darkPaperDisabled = () => addon.self.disabled || !addon.settings.get("affectPaper");

  // Change the colors used by the selection tool
  const isDefaultGuideColor = (color) =>
    color.type === "rgb" && color.red === 0 && color.green === 0.615686274509804 && color.blue === 0.9254901960784314;
  const oldItemDraw = paper.Item.prototype.draw;
  paper.Item.prototype.draw = function (...args) {
    if (darkPaperDisabled()) {
      this.saColorChanged = false;
      if (this.saOldFillColor) this.fillColor = this.saOldFillColor;
      if (this.saOldStrokeColor) this.strokeColor = this.saOldStrokeColor;
      return oldItemDraw.apply(this, args);
    }
    if (this.saColorChanged) return oldItemDraw.apply(this, args);
    if (this.data.isRectSelect) {
      this.saOldStrokeColor = this.strokeColor;
      this.saColorChanged = true;
      this.strokeColor = textColor(
        addon.settings.get("accent"),
        multiply(addon.settings.get("accent"), { r: 0.67, g: 0.67, b: 0.67 }),
        brighten(addon.settings.get("accent"), { r: 0.67, g: 0.67, b: 0.67 })
      );
    } else if (this.parent?.data.isGuideLayer || this.parent?.parent?.data.isGuideLayer) {
      if (
        this.data.origItem || // hover indicator
        this.parent?.selectionAnchor === this
      ) {
        this.saOldStrokeColor = this.parent?.selectionAnchor === this ? null : this.strokeColor;
        this.saColorChanged = true;
        this.strokeColor = addon.settings.get("highlightText");
      } else if (this.strokeColor && isDefaultGuideColor(this.strokeColor)) {
        this.saOldStrokeColor = this.strokeColor;
        this.saColorChanged = true;
        this.strokeColor = secondaryColor();
      }
      if (this.fillColor && isDefaultGuideColor(this.fillColor)) {
        this.saOldFillColor = this.fillColor;
        this.saColorChanged = true;
        this.fillColor = addon.settings.get("highlightText");
      }
    }
    return oldItemDraw.apply(this, args);
  };
  paper.Item.prototype.getSelectedColor = () => (darkPaperDisabled() ? null : new paper.Color(secondaryColor()));

  // Change the colors of background layers
  const updateColors = () => {
    // No need to update if costume editor is hidden
    if (!paper.project) return;
    let artboardBackground;
    let workspaceBackground;
    let checkerboardColor;
    let blueOutlineColor;
    let crosshairOuterColor;
    let crosshairInnerColor;
    if (!darkPaperDisabled()) {
      artboardBackground = addon.settings.get("accent");
      workspaceBackground = alphaBlend(
        addon.settings.get("accent"),
        multiply(addon.settings.get("primary"), { a: 0.1 })
      );
      checkerboardColor = textColor(
        addon.settings.get("accent"),
        alphaBlend(
          addon.settings.get("accent"),
          multiply(makeHsv(addon.settings.get("primary"), 1, 0.67), { a: 0.15 })
        ),
        alphaBlend(addon.settings.get("accent"), multiply(makeHsv(addon.settings.get("primary"), 0.5, 1), { a: 0.15 })),
        112 // threshold: #707070
      );
      blueOutlineColor = secondaryColor();
      crosshairOuterColor = textColor(addon.settings.get("accent"), "#ffffff", "#000000");
      crosshairInnerColor = textColor(addon.settings.get("accent"), "#000000", "#ffffff");
    } else {
      artboardBackground = "#ffffff";
      workspaceBackground = "#ecf1f9";
      checkerboardColor = "#d9e3f2";
      blueOutlineColor = "#4280d7";
      crosshairOuterColor = "#ffffff";
      crosshairInnerColor = "#000000";
    }
    for (let layer of paper.project.layers) {
      if (layer.data.isBackgroundGuideLayer) {
        layer.vectorBackground._children[0].fillColor = workspaceBackground;
        layer.vectorBackground._children[1]._children[0].fillColor = artboardBackground;
        layer.vectorBackground._children[1]._children[1].fillColor = checkerboardColor;
        layer.bitmapBackground._children[0].fillColor = artboardBackground;
        layer.bitmapBackground._children[1].fillColor = checkerboardColor;
        for (let i = 0; i < 3; i++) layer._children[2]._children[i].strokeColor = crosshairOuterColor;
        for (let i = 3; i < 6; i++) layer._children[2]._children[i].strokeColor = crosshairInnerColor;
      } else if (layer.data.isOutlineLayer) {
        layer._children[0].strokeColor = artboardBackground;
        layer._children[1].strokeColor = blueOutlineColor;
      } else if (layer.data.isDragCrosshairLayer) {
        for (let i = 0; i < 3; i++) layer.dragCrosshair._children[i].strokeColor = crosshairOuterColor;
        for (let i = 3; i < 6; i++) layer.dragCrosshair._children[i].strokeColor = crosshairInnerColor;
      }
    }
  };
  addon.settings.addEventListener("change", updateColors);
  addon.self.addEventListener("disabled", updateColors);
  addon.self.addEventListener("reenabled", updateColors);
  while (true) {
    await addon.tab.waitForElement("[class^=paper-canvas_paper-canvas_]", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/mode/SET_PLAYER"],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    updateColors();
  }
}
