export default async function ({ addon, global, console }) {
  (function (Blockly) {
    'use strict'

    const workspace = Blockly.getMainWorkspace()
    const BlockSvg = Blockly.getMainWorkspace().newBlock().constructor

    const { GRID_UNIT } = BlockSvg
    var multiplier = 1

    function forceUpdateBlocks (workspace) {
      workspace.getAllBlocks()
        .forEach(b => b.render())
    }

    function updateAllBlocks () {
      forceUpdateBlocks(workspace)
      forceUpdateBlocks(workspace.getFlyout().workspace_)
    }

    function applyChanges () {
      multiplier = addon.settings.get("paddingSize") / 100
      BlockSvg.SEP_SPACE_Y = 2 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_X = 16 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_X_OUTPUT = 12 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_X_SHADOW_OUTPUT = 10 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_Y = 12 * GRID_UNIT * multiplier
      BlockSvg.EXTRA_STATEMENT_ROW_Y = 8 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_X_WITH_STATEMENT = 40 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_Y_SINGLE_FIELD_OUTPUT = 8 * GRID_UNIT * multiplier
      BlockSvg.MIN_BLOCK_Y_REPORTER = 10 * GRID_UNIT * multiplier
      BlockSvg.MIN_STATEMENT_INPUT_HEIGHT = 6 * GRID_UNIT * multiplier
      BlockSvg.NOTCH_WIDTH = 8 * GRID_UNIT * multiplier
      BlockSvg.NOTCH_HEIGHT = 2 * GRID_UNIT * multiplier
      BlockSvg.NOTCH_START_PADDING = 3 * GRID_UNIT //* multiplier
      BlockSvg.CORNER_RADIUS = 1 * GRID_UNIT * addon.settings.get("cornerSize") / 100
      BlockSvg.ICON_SEPARATOR_HEIGHT = 10 * GRID_UNIT * multiplier
      BlockSvg.NOTCH_PATH_LEFT = (
        'c 2,0 3,1 4,2 ' +
        'l ' + 4 * multiplier + ',' + 4 * multiplier +
        ' c 1,1 2,2 4,2 ' +
        'h ' + 24 * (multiplier - 0.5) +
        ' c 2,0 3,-1 4,-2 ' +
        'l ' + 4 * multiplier + ',' + -4 * multiplier +
        'c 1,-1 2,-2 4,-2'
      )
      BlockSvg.NOTCH_PATH_RIGHT = (
        'c -2,0 -3,1 -4,2 ' +
        'l ' + -4 * multiplier + ',' + 4 * multiplier +
        'c -1,1 -2,2 -4,2 ' +
        'h ' + -24 * (multiplier - 0.5) +
        ' c -2,0 -3,-1 -4,-2 ' +
        'l ' + -4 * multiplier + ',' + -4 * multiplier +
        'c -1,-1 -2,-2 -4,-2'
      )
      BlockSvg.INPUT_SHAPE_HEXAGONAL =
        'M ' + 4 * GRID_UNIT + ',0 ' +
        ' h ' + 4 * GRID_UNIT +
        ' l ' + 4 * GRID_UNIT + ',' + 4 * GRID_UNIT +
        ' l ' + -4 * GRID_UNIT + ',' + 4 * GRID_UNIT +
        ' h ' + -4 * GRID_UNIT +
        ' l ' + -4 * GRID_UNIT + ',' + -4 * GRID_UNIT +
        ' l ' + 4 * GRID_UNIT + ',' + -4 * GRID_UNIT +
        ' z'
      BlockSvg.INPUT_SHAPE_HEXAGONAL_WIDTH = 12 * GRID_UNIT * multiplier
      BlockSvg.INPUT_SHAPE_ROUND =
        'M ' + (4 * GRID_UNIT) + ',0' +
        ' h ' + (4 * GRID_UNIT) +
        ' a ' + (4 * GRID_UNIT) + ' ' +
        (4 * GRID_UNIT) + ' 0 0 1 0 ' +
        (8 * GRID_UNIT)
        ' h ' + (-4 * GRID_UNIT) +
        ' a ' + (4 * GRID_UNIT) + ' ' +
        (4 * GRID_UNIT) + ' 0 0 1 0 -' +
        (8 * GRID_UNIT) + ' z'
      BlockSvg.INPUT_SHAPE_ROUND_WIDTH = 12 * GRID_UNIT * multiplier
      BlockSvg.INPUT_SHAPE_HEIGHT = 8 * GRID_UNIT * multiplier
      BlockSvg.FIELD_HEIGHT = 8 * GRID_UNIT * multiplier // NOTE: Determines string input heights
      BlockSvg.FIELD_WIDTH = 0 * GRID_UNIT * multiplier
      BlockSvg.FIELD_DEFAULT_CORNER_RADIUS = 4 * GRID_UNIT * multiplier
      BlockSvg.EDITABLE_FIELD_PADDING = 1.5 * GRID_UNIT * multiplier
      BlockSvg.BOX_FIELD_PADDING = 2 * GRID_UNIT * multiplier
      BlockSvg.DROPDOWN_ARROW_PADDING = 2 * GRID_UNIT * multiplier
      BlockSvg.FIELD_WIDTH_MIN_EDIT = 8 * GRID_UNIT * multiplier
      BlockSvg.INPUT_AND_FIELD_MIN_X = 12 * GRID_UNIT * multiplier
      BlockSvg.INLINE_PADDING_Y = 1 * GRID_UNIT * multiplier // For when reporters are inside reporters
      BlockSvg.SHAPE_IN_SHAPE_PADDING[1][0] = 5 * GRID_UNIT * multiplier
      BlockSvg.SHAPE_IN_SHAPE_PADDING[1][2] = 5 * GRID_UNIT * multiplier
      BlockSvg.SHAPE_IN_SHAPE_PADDING[1][3] = 5 * GRID_UNIT * multiplier
    }

    function applyAndUpdate() {
      applyChanges()
      updateAllBlocks()
    }
    
    addon.settings.addEventListener("change", function() {
      applyChanges()
      updateAllBlocks()
    });

    applyAndUpdate()

  })(window.Blockly)
}
