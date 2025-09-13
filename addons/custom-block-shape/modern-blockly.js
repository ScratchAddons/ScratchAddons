import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  if (!Blockly.registry) return;

  const ScratchRenderer = Blockly.registry.getClass(Blockly.registry.Type.RENDERER, "scratch");
  const oldScratchRendererMakeConstants = ScratchRenderer.prototype.makeConstants_;
  ScratchRenderer.prototype.makeConstants_ = function () {
    const constants = oldScratchRendererMakeConstants.call(this);
    if (addon.self.disabled) return constants;

    const GRID_UNIT = constants.GRID_UNIT;
    const multiplier = addon.settings.get("paddingSize") / 100;
    const cornerSize = addon.settings.get("cornerSize") / 100;
    const notchSize = addon.settings.get("notchSize") / 100;

    constants.CORNER_RADIUS = GRID_UNIT * cornerSize;

    constants.SMALL_PADDING = GRID_UNIT * multiplier;
    constants.MEDIUM_PADDING = 2 * GRID_UNIT * multiplier;
    constants.LARGE_PADDING = 4 * GRID_UNIT * multiplier;

    constants.NOTCH_WIDTH = 9 * GRID_UNIT * multiplier;
    constants.NOTCH_HEIGHT = 2 * GRID_UNIT * multiplier * notchSize;

    constants.MIN_BLOCK_WIDTH = 2 * GRID_UNIT * multiplier;
    constants.MIN_BLOCK_HEIGHT = 12 * GRID_UNIT * multiplier;
    constants.TOP_ROW_MIN_HEIGHT = GRID_UNIT * multiplier;
    constants.TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT = constants.LARGE_PADDING;
    constants.BOTTOM_ROW_MIN_HEIGHT = GRID_UNIT * multiplier;
    constants.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = 6 * GRID_UNIT * multiplier;

    constants.STATEMENT_BOTTOM_SPACER = -constants.NOTCH_HEIGHT;
    constants.STATEMENT_INPUT_SPACER_MIN_WIDTH = 40 * GRID_UNIT * multiplier;

    constants.EMPTY_INLINE_INPUT_PADDING = 4 * GRID_UNIT * multiplier;
    constants.EMPTY_INLINE_INPUT_HEIGHT = 8 * GRID_UNIT * multiplier;

    constants.DUMMY_INPUT_MIN_HEIGHT = 8 * GRID_UNIT * multiplier;
    constants.DUMMY_INPUT_SHADOW_MIN_HEIGHT = 6 * GRID_UNIT * multiplier;

    constants.FIELD_BORDER_RECT_RADIUS = constants.CORNER_RADIUS;
    constants.FIELD_BORDER_RECT_X_PADDING = 2 * GRID_UNIT * multiplier;
    constants.FIELD_BORDER_RECT_Y_PADDING = 1.625 * GRID_UNIT * multiplier;
    constants.FIELD_DROPDOWN_SVG_ARROW_PADDING = constants.FIELD_BORDER_RECT_X_PADDING;

    constants.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH = 12 * GRID_UNIT * multiplier;

    constants.SHAPE_IN_SHAPE_PADDING[1][0] = 5 * GRID_UNIT * multiplier; // Field in hexagon
    constants.SHAPE_IN_SHAPE_PADDING[1][2] = 5 * GRID_UNIT * multiplier; // Round in hexagon
    constants.SHAPE_IN_SHAPE_PADDING[1][3] = 5 * GRID_UNIT * multiplier; // Square in hexagon

    return constants;
  };

  const oldZelosSetFontConstants = Blockly.zelos.ConstantProvider.prototype.setFontConstants_;
  Blockly.zelos.ConstantProvider.prototype.setFontConstants_ = function (...args) {
    oldZelosSetFontConstants.call(this, ...args);
    if (addon.self.disabled) return;
    const multiplier = addon.settings.get("paddingSize") / 100;
    if (multiplier < 1) {
      // Allow fields to be smaller than the font height
      this.FIELD_TEXT_HEIGHT = 0;
      this.FIELD_BORDER_RECT_HEIGHT = 8 * this.GRID_UNIT * multiplier;
      this.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = 8 * this.GRID_UNIT * multiplier;
    }
  };

  const oldZelosCreateRows = Blockly.zelos.RenderInfo.prototype.createRows_;
  Blockly.zelos.RenderInfo.prototype.createRows_ = function () {
    oldZelosCreateRows.call(this);
    if (addon.self.disabled) return;
    // Set the height of rounded corners and notches to zero
    // to prevent them from interfering with vertical spacing
    for (const row of this.rows) {
      for (const element of row.elements) {
        if (
          Blockly.blockRendering.Types.isRoundCorner(element) ||
          Blockly.blockRendering.Types.isPreviousConnection(element)
        ) {
          element.height = 0;
        }
      }
    }
  };

  const oldZelosGetSpacerRowHeight = Blockly.zelos.RenderInfo.prototype.getSpacerRowHeight_;
  Blockly.zelos.RenderInfo.prototype.getSpacerRowHeight_ = function (prev, next) {
    if (!addon.self.disabled) {
      // Space before and after statement input
      const followsStatement = Blockly.blockRendering.Types.isInputRow(prev) && prev.hasStatement;
      const precedesStatement = Blockly.blockRendering.Types.isInputRow(next) && next.hasStatement;
      if (followsStatement || precedesStatement) {
        return this.constants_.MEDIUM_PADDING;
      }
      // Space at the top and bottom of a stack/hat block
      if (
        !this.outputConnection &&
        (Blockly.blockRendering.Types.isTopRow(prev) || Blockly.blockRendering.Types.isBottomRow(next))
      ) {
        return this.constants_.SMALL_PADDING;
      }
    }
    return oldZelosGetSpacerRowHeight.call(this, prev, next);
  };

  const oldZelosGetNegativeSpacing = Blockly.zelos.RenderInfo.prototype.getNegativeSpacing_;
  Blockly.zelos.RenderInfo.prototype.getNegativeSpacing_ = function (element) {
    // Fix extra space on the left side of blocks with an "icon" (block comment or flyout checkbox)
    if (!addon.self.disabled && Blockly.blockRendering.Types.isIcon(element)) {
      const connectionWidth = this.outputConnection.width;
      const outerShape = this.outputConnection.shape.type;
      return connectionWidth - this.constants_.SHAPE_IN_SHAPE_PADDING[outerShape][0];
    }
    return oldZelosGetNegativeSpacing.call(this, element);
  };

  Blockly.zelos.Drawer.prototype.drawRightSideRow_ = function (row) {
    // Rewritten to fix rendering bugs when the corner radius is larger than the padding
    if (!Blockly.blockRendering.Types.isSpacer(row)) return;
    if (row.precedesStatement) {
      this.outlinePath_ += Blockly.utils.svgPaths.lineOnAxis(
        "V",
        row.yPos + row.height - this.constants_.INSIDE_CORNERS.rightHeight
      );
      this.outlinePath_ += this.constants_.INSIDE_CORNERS.pathTopRight;
    } else if (row.followsStatement) {
      this.outlinePath_ += this.constants_.INSIDE_CORNERS.pathBottomRight;
    }
  };

  const ScratchCommentIcon = Blockly.registry.getClass(
    Blockly.registry.Type.ICON,
    Blockly.icons.IconType.COMMENT.toString()
  );
  const oldCommentIconGetSize = ScratchCommentIcon.prototype.getSize;
  ScratchCommentIcon.prototype.getSize = function () {
    // https://github.com/scratchfoundation/scratch-blocks/blob/e6ecb8e/src/scratch_comment_icon.ts#L55
    if (addon.self.disabled) return oldCommentIconGetSize.call(this);
    const multiplier = addon.settings.get("paddingSize") / 100;
    return new Blockly.utils.Size(-8 * multiplier, 0);
  };

  const FlyoutCheckboxIcon = Blockly.registry.getClass(Blockly.registry.Type.ICON, "checkbox");
  const oldFlyoutCheckboxIconGetSize = FlyoutCheckboxIcon.prototype.getSize;
  FlyoutCheckboxIcon.prototype.getSize = function () {
    // https://github.com/scratchfoundation/scratch-blocks/blob/e6ecb8e/src/flyout_checkbox_icon.ts#L31
    if (addon.self.disabled) return oldFlyoutCheckboxIconGetSize.call(this);
    const multiplier = addon.settings.get("paddingSize") / 100;
    return new Blockly.utils.Size(-8 * multiplier, 0);
  };

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
  addon.settings.addEventListener("change", () => updateRendererAndBlocks());
  addon.self.addEventListener("disabled", () => updateRendererAndBlocks());
  addon.self.addEventListener("reenabled", () => updateRendererAndBlocks());
  updateRendererAndBlocks();
}
