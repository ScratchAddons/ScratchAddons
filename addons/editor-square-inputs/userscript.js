import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

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

    const ScratchRenderer = ScratchBlocks.registry.getClass(ScratchBlocks.registry.Type.RENDERER, "scratch_classic");

    const originalMakeConstants = ScratchRenderer.prototype.makeConstants_;
    ScratchRenderer.prototype.makeConstants_ = function () {
      const constants = originalMakeConstants.call(this);

      const originalShapeFor = constants.shapeFor;
      constants.shapeFor = function (connection) {
        if (!addon.self.disabled && connection.type === ScratchBlocks.ConnectionType.INPUT_VALUE) {
          const connectedBlock = connection.targetBlock();
          if (connectedBlock && connectedBlock.getOutputShape() === SQUARE) {
            return this.SQUARED;
          }
        }
        return originalShapeFor.call(this, connection);
      };

      return constants;
    };

    const originalMakeDrawer = ScratchRenderer.prototype.makeDrawer_;
    ScratchRenderer.prototype.makeDrawer_ = function (...args) {
      const drawer = originalMakeDrawer.call(this, ...args);

      const originalDrawConnectionHighlightPath = drawer.drawConnectionHighlightPath;
      drawer.drawConnectionHighlightPath = function (measurable) {
        if (
          !addon.self.disabled &&
          measurable.connectionModel.type === ScratchBlocks.ConnectionType.INPUT_VALUE &&
          measurable.isDynamicShape &&
          measurable.shape.type === SQUARE
        ) {
          // Add horizontal padding between a square input and its connection highlight
          const oldConnectionWidth = measurable.connectionWidth;
          measurable.connectionWidth -= 1.5;
          const result = originalDrawConnectionHighlightPath.call(this, measurable);
          measurable.connectionWidth = oldConnectionWidth;
          return result;
        }
        return originalDrawConnectionHighlightPath.call(this, measurable);
      };

      return drawer;
    };
  }

  const updateRendererAndBlocks = () => {
    const workspace = addon.tab.traps.getWorkspace();
    workspace.renderer.refreshDom(workspace.getSvgGroup(), workspace.getTheme(), workspace.getInjectionDiv());

    const flyout = workspace.getFlyout();
    if (flyout) {
      const flyoutWorkspace = flyout.getWorkspace();
      flyoutWorkspace.renderer.refreshDom(flyoutWorkspace.getSvgGroup(), flyoutWorkspace.getTheme(), null);
    }

    updateAllBlocks(addon.tab);
  };

  addon.self.addEventListener("disabled", () => updateRendererAndBlocks());
  addon.self.addEventListener("reenabled", () => updateRendererAndBlocks());
  addon.settings.addEventListener("change", () => updateRendererAndBlocks());
  updateRendererAndBlocks();
}
