// ==UserScript==
// @name         Thinner Scratch blocks
// @namespace    https://sheeptester.github.io/
// @version      0.1
// @description  Make the Scratch blocks thinner
// @author       SheepTester
// @match        *://*.github.io/scratch-gui/*
// @include      *://scratch.mit.edu/projects/*
// @grant        none
// ==/UserScript==

(function (Blockly) {
  'use strict'

  const workspace = Blockly.getMainWorkspace()
  const BlockSvg = Blockly.getMainWorkspace().newBlock().constructor

  const { GRID_UNIT } = BlockSvg

  function forceUpdateBlocks (workspace) {
    workspace.getAllBlocks()
      .forEach(b => b.render())
  }

  function updateAllBlocks () {
    forceUpdateBlocks(workspace)
    forceUpdateBlocks(workspace.getFlyout().workspace_)
  }

  function applyChanges () {
    BlockSvg.MIN_BLOCK_X = 13 * GRID_UNIT
    BlockSvg.MIN_BLOCK_X_OUTPUT = 0
    BlockSvg.MIN_BLOCK_X_SHADOW_OUTPUT = 5 * GRID_UNIT
    BlockSvg.MIN_BLOCK_Y = 7 * GRID_UNIT
    BlockSvg.EXTRA_STATEMENT_ROW_Y = 5 * GRID_UNIT
    BlockSvg.MIN_BLOCK_X_WITH_STATEMENT = 20 * GRID_UNIT
    BlockSvg.MIN_BLOCK_Y_SINGLE_FIELD_OUTPUT = 0
    BlockSvg.MIN_BLOCK_Y_REPORTER = 7 * GRID_UNIT
    BlockSvg.MIN_STATEMENT_INPUT_HEIGHT = 3 * GRID_UNIT
    BlockSvg.NOTCH_WIDTH = 6 * GRID_UNIT
    BlockSvg.ICON_SEPARATOR_HEIGHT = 6 * GRID_UNIT
    BlockSvg.NOTCH_PATH_LEFT = (
      'c 2,0 3,1 4,2 ' +
      'l 2,2 ' +
      'c 1,1 2,2 4,2 ' +
      'h 8 ' +
      'c 2,0 3,-1 4,-2 ' +
      'l 2,-2 ' +
      'c 1,-1 2,-2 4,-2'
    )
    BlockSvg.NOTCH_PATH_RIGHT = (
      'c -2,0 -3,1 -4,2 ' +
      'l -2,2 ' +
      'c -1,1 -2,2 -4,2 ' +
      'h -8 ' +
      'c -2,0 -3,-1 -4,-2 ' +
      'l -2,-2 ' +
      'c -1,-1 -2,-2 -4,-2'
    )
    BlockSvg.INPUT_SHAPE_HEXAGONAL =
      'M ' + 2.5 * GRID_UNIT + ',-1 ' +
      ' h ' + 4 * GRID_UNIT +
      ' l ' + 2.5 * GRID_UNIT + ',' + 2.5 * GRID_UNIT +
      ' l ' + -2.5 * GRID_UNIT + ',' + 2.5 * GRID_UNIT +
      ' h ' + -4 * GRID_UNIT +
      ' l ' + -2.5 * GRID_UNIT + ',' + -2.5 * GRID_UNIT +
      ' l ' + 2.5 * GRID_UNIT + ',' + -2.5 * GRID_UNIT +
      ' z'
    BlockSvg.INPUT_SHAPE_HEXAGONAL_WIDTH = 9 * GRID_UNIT
    BlockSvg.INPUT_SHAPE_ROUND =
      'M ' + (4 * GRID_UNIT) + ',0' +
      ' h ' + (4 * GRID_UNIT) +
      ' a ' + (4 * GRID_UNIT) + ' ' +
      (4 * GRID_UNIT) + ' 0 0 1 0 ' +
      ' h ' + (-4 * GRID_UNIT) +
      ' a ' + (4 * GRID_UNIT) + ' ' +
      (4 * GRID_UNIT) + ' 0 0 1 0 -' +
      ' z'
    BlockSvg.INPUT_SHAPE_ROUND_WIDTH = 0
    BlockSvg.INPUT_SHAPE_HEIGHT = 4 * GRID_UNIT
    BlockSvg.FIELD_HEIGHT = 5 * GRID_UNIT // NOTE: Determines string input heights
    BlockSvg.FIELD_WIDTH = 0
    BlockSvg.EDITABLE_FIELD_PADDING = 0 // TODO
    BlockSvg.BOX_FIELD_PADDING = 2 * GRID_UNIT
    BlockSvg.DROPDOWN_ARROW_PADDING = 1 * GRID_UNIT
    BlockSvg.FIELD_WIDTH_MIN_EDIT = 0
    BlockSvg.INPUT_AND_FIELD_MIN_X = 9 * GRID_UNIT
    BlockSvg.INLINE_PADDING_Y = 1 * GRID_UNIT // For when reporters are inside reporters
    BlockSvg.BOX_FIELD_PADDING = 2 * GRID_UNIT
    BlockSvg.BOX_FIELD_PADDING = 2 * GRID_UNIT
    BlockSvg.SHAPE_IN_SHAPE_PADDING[1][0] = 4 * GRID_UNIT
    BlockSvg.SHAPE_IN_SHAPE_PADDING[1][2] = 3 * GRID_UNIT
    BlockSvg.SHAPE_IN_SHAPE_PADDING[1][3] = 3 * GRID_UNIT
  }

  applyChanges()
  updateAllBlocks()
})(window.Blockly)
