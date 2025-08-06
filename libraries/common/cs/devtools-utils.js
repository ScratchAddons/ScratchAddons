/**
 * Find all the uses of a named variable.
 * @param {string} id ID of the variable to find.
 * @return {!Array.<!Blockly.Block>} Array of block usages.
 */
export const getVariableUsesById = (id, workspace) => {
  let uses = [];

  let topBlocks = getTopBlocks(workspace);
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
 * A nicely ordered version of the top blocks
 * @returns {[Blockly.Block]}
 */
export const getTopBlocks = (workspace) => {
  let result = getOrderedTopBlockColumns(false, workspace);
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

export const autoPositionComment = (comment) => {
  if (typeof comment.autoPosition_ === "function") {
    comment.needsAutoPositioning_ = true;
    comment.autoPosition_();
    comment.needsAutoPositioning_ = false;
  }
};

/**
 * Split the top blocks into ordered columns
 * @param separateOrphans true to keep all orphans separate
 * @returns {{orphans: {blocks: [Block], x: number, count: number}, cols: [Col]}}
 */
export const getOrderedTopBlockColumns = (separateOrphans, workspace) => {
  let w = workspace;
  let topBlocks = w.getTopBlocks();
  let maxWidths = {};

  if (separateOrphans) {
    if (w.getTheme) {
      // new Blockly
      const blocks = w.getAllBlocks();
      for (const block of blocks) {
        for (const icon of block.getIcons()) {
          if (icon.commentBubble) {
            const comment = icon.commentBubble;
            const right = comment.getRelativeToSurfaceXY().x + comment.getSize().width;

            const root = comment.getSourceBlock().getRootBlock();
            const left = root.getRelativeToSurfaceXY().x;
            maxWidths[root.id] = Math.max(right - left, maxWidths[root.id] || 0);
          }
        }
      }
    } else {
      let topComments = w.getTopComments();

      for (const comment of topComments) {
        if (comment.block_) {
          autoPositionComment(comment);
          let right = comment.getBoundingRectangle().bottomRight.x;

          let root = comment.block_.getRootBlock();
          let left = root.getBoundingRectangle().topLeft.x;
          maxWidths[root.id] = Math.max(right - left, maxWidths[root.id] || 0);
        }
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
