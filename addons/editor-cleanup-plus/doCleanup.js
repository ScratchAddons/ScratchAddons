import UndoGroup from "../editor-devtools/UndoGroup.js";

/**
 * A much nicer way of laying out the blocks into columns
 */
export default function doCleanUp(block, getWorkspace, msg) {
  let workspace = getWorkspace();
  let makeSpaceForBlock = block && block.getRootBlock();

  UndoGroup.startUndoGroup(workspace);

  /**
  * Find all the uses of a named variable.
  * @param {string} id ID of the variable to find.
  * @return {!Array.<!Blockly.Block>} Array of block usages.
  */
  const getVariableUsesById = (id) => {
    let uses = [];

    let topBlocks = getTopBlocks(true);
    for (const topBlock of topBlocks) {
      let kids = topBlock.getDescendants();
      for (const block of kids) {
        let blockVariables = block.getVarModels();
        if (blockVariables) {
          for (const blockVar of blockVariables) {
            if (blockVar.getId() === id) {
              uses.push(block);
            }
          }
        }
      }
    }

    return uses;
  };

  /**
  * Split the top blocks into ordered columns
  * @param separateOrphans true to keep all orphans separate
  * @returns {{orphans: {blocks: [Block], x: number, count: number}, cols: [Col]}}
  */
  const getOrderedTopBlockColumns = (separateOrphans) => {
    let w = getWorkspace();
    let topBlocks = w.getTopBlocks();
    let maxWidths = {};

    if (separateOrphans) {
      let topComments = w.getTopComments();

      for (const comment of topComments) {
        if (comment.setVisible) {
          comment.setVisible(false);
          comment.needsAutoPositioning_ = true;
          comment.setVisible(true);

          let right = comment.getBoundingRectangle().bottomRight.x;

          let root = comment.block_.getRootBlock();
          let left = root.getBoundingRectangle().topLeft.x;
          maxWidths[root.id] = Math.max(right - left, maxWidths[root.id] || 0);
        }
      }
    }

    let cols = [];
    const TOLERANCE = 256;
    let orphans = { x: -999999, count: 0, blocks: [] };

    for (const topBlock of topBlocks) {
      let position = topBlock.getRelativeToSurfaceXY();
      let bestCol = null;
      let bestError = TOLERANCE;

      if (separateOrphans && isBlockAnOrphan(topBlock)) {
        orphans.blocks.push(topBlock);
        continue;
      }

      for (const col of cols) {
        let err = Math.abs(position.x - col.x);
        if (err < bestError) {
          bestError = err;
          bestCol = col;
        }
      }

      if (bestCol) {
        bestCol.x = (bestCol.x * bestCol.count + position.x) / ++bestCol.count;
        bestCol.blocks.push(topBlock);
      } else {
        cols.push(new Col(position.x, 1, [topBlock]));
      }
    }

    cols.sort((a, b) => a.x - b.x);
    for (const col of cols) {
      col.blocks.sort((a, b) => a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y);
    }

    return { cols: cols, orphans: orphans, maxWidths: maxWidths };
  };

  /**
   * A nicely ordered version of the top blocks
   * @returns {[Blockly.Block]}
   */
  const getTopBlocks = () => {
    let result = getOrderedTopBlockColumns();
    let columns = result.cols;
    /**
     * @type {[[Blockly.Block]]}
     */
    let topBlocks = [];
    for (const col of columns) {
      topBlocks = topBlocks.concat(col.blocks);
    }
    return topBlocks;
  };

  let result = getOrderedTopBlockColumns(true);
  let columns = result.cols;
  let orphanCount = result.orphans.blocks.length;
  if (orphanCount > 0 && !block) {
    let message = msg("orphaned", {
      count: orphanCount,
    });
    if (confirm(message)) {
      for (const block of result.orphans.blocks) {
        block.dispose();
      }
    } else {
      columns.unshift(result.orphans);
    }
  }

  let cursorX = 48;

  let maxWidths = result.maxWidths;

  for (const column of columns) {
    let cursorY = 64;
    let maxWidth = 0;

    for (const block of column.blocks) {
      let extraWidth = block === makeSpaceForBlock ? 380 : 0;
      let extraHeight = block === makeSpaceForBlock ? 480 : 72;
      let xy = block.getRelativeToSurfaceXY();
      if (cursorX - xy.x !== 0 || cursorY - xy.y !== 0) {
        block.moveBy(cursorX - xy.x, cursorY - xy.y);
      }
      let heightWidth = block.getHeightWidth();
      cursorY += heightWidth.height + extraHeight;

      let maxWidthWithComments = maxWidths[block.id] || 0;
      maxWidth = Math.max(maxWidth, Math.max(heightWidth.width + extraWidth, maxWidthWithComments));
    }

    cursorX += maxWidth + 96;
  }

  let topComments = workspace.getTopComments();
  for (const comment of topComments) {
    if (comment.setVisible) {
      comment.setVisible(false);
      comment.needsAutoPositioning_ = true;
      comment.setVisible(true);
    }
  }

  setTimeout(() => {
    // Locate unused local variables...
    let workspace = getWorkspace();
    let map = workspace.getVariableMap();
    let vars = map.getVariablesOfType("");
    let unusedLocals = [];

    for (const row of vars) {
      if (row.isLocal) {
        let usages = getVariableUsesById(row.getId());
        if (!usages || usages.length === 0) {
          unusedLocals.push(row);
        }
      }
    }

    if (unusedLocals.length > 0) {
      const unusedCount = unusedLocals.length;
      let message = msg("unused-var", {
        count: unusedCount,
      });
      for (let i = 0; i < unusedLocals.length; i++) {
        let orphan = unusedLocals[i];
        if (i > 0) {
          message += ", ";
        }
        message += orphan.name;
      }
      if (confirm(message)) {
        for (const orphan of unusedLocals) {
          workspace.deleteVariableById(orphan.getId());
        }
      }
    }

    // Locate unused local lists...
    let lists = map.getVariablesOfType("list");
    let unusedLists = [];

    for (const row of lists) {
      if (row.isLocal) {
        let usages = getVariableUsesById(row.getId());
        if (!usages || usages.length === 0) {
          unusedLists.push(row);
        }
      }
    }
    if (unusedLists.length > 0) {
      const unusedCount = unusedLists.length;
      let message = msg("unused-list", {
        count: unusedCount,
      });
      for (let i = 0; i < unusedLists.length; i++) {
        let orphan = unusedLists[i];
        if (i > 0) {
          message += ", ";
        }
        message += orphan.name;
      }
      if (confirm(message)) {
        for (const orphan of unusedLists) {
          workspace.deleteVariableById(orphan.getId());
        }
      }
    }

    UndoGroup.endUndoGroup(workspace);
  }, 100);
};

/**
 * Badly Orphaned - might want to delete these!
 * @param topBlock
 * @returns {boolean}
 */
const isBlockAnOrphan = (topBlock) => {
  return !!topBlock.outputConnection;
};

class Col {
  /**
   * @param x {Number} x position (for ordering)
   * @param count {Number}
   * @param blocks {[Block]}
   */
  constructor(x, count, blocks) {
    this.x = x;
    this.count = count;
    this.blocks = blocks;
  }
}
