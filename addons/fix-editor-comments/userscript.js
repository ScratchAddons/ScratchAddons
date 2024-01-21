export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();

  /*
   * When a block with a comment attached is dragged, the comment now properly
   * stores its updated position.
   * https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/scratch_bubble.js#L536
   */
  const originalBlockMove = Blockly.ScratchBubble.prototype.setAnchorLocation;
  Blockly.ScratchBubble.prototype.setAnchorLocation = function (xy) {
    if (!addon.self.disabled && addon.settings.get("fix-drag")) {
      var event = new Blockly.Events.CommentMove(this.comment);
      this.anchorXY_ = xy;
      if (this.rendered_) {
        this.positionBubble_();
      }
      event.recordNew();
      Blockly.Events.fire(event);
    } else {
      return originalBlockMove.call(this, xy);
    }
  };

  /*
   * Do not use the widest block in the stack to calculate comment location.
   * https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/scratch_block_comment.js#L307
   */
  const originalPosition = Blockly.ScratchBlockComment.prototype.autoPosition_;
  Blockly.ScratchBlockComment.prototype.autoPosition_ = function () {
    if (!addon.self.disabled && addon.settings.get("leash")) {
      if (!this.needsAutoPositioning_ || this.isMinimized_) return;
      let offset = 8 * Blockly.BlockSvg.GRID_UNIT;
      this.x_ = this.block_.RTL ? this.iconXY_.x - this.width_ - offset : this.iconXY_.x + offset;
      this.y_ = this.iconXY_.y - Blockly.ScratchBubble.TOP_BAR_HEIGHT / 2;
    } else return originalPosition.call(this);
  };

  /*
   * When setting a comment's location, keep the Y position level with the block.
   * https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/bubble_dragger.js#L139
   * https://github.com/scratchfoundation/scratch-blocks/blob/develop/core/bubble_dragger.js#L202
   */

  const originalCommentEndDrag = Blockly.BubbleDragger.prototype.endBubbleDrag;
  Blockly.BubbleDragger.prototype.endBubbleDrag = function (e, currentDragDeltaXY) {
    if (!addon.self.disabled && addon.settings.get("straighten") && this.draggingBubble_.comment) {
      const y = this.draggingBubble_.comment.iconXY_.y - Blockly.ScratchBubble.TOP_BAR_HEIGHT / 2;
      currentDragDeltaXY.y = y - this.startXY_.y;
    }
    return originalCommentEndDrag.call(this, e, currentDragDeltaXY);
  };

  // Enforces the Y position even while dragging (disabled)
  /*const originalCommentDrag = Blockly.BubbleDragger.prototype.dragBubble;
  Blockly.BubbleDragger.prototype.dragBubble = function (e, currentDragDeltaXY) {
    // Checking `this.draggingBubble_.comment` ensures that workspace comments are unaffected
    if (!addon.self.disabled && addon.settings.get("straighten") && this.draggingBubble_.comment) {
      const y = this.draggingBubble_.comment.iconXY_.y - Blockly.ScratchBubble.TOP_BAR_HEIGHT / 2;
      currentDragDeltaXY.y = y - this.startXY_.y;
    }
    return originalCommentDrag.call(this, e, currentDragDeltaXY);
  };*/
}
