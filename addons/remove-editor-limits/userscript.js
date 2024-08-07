// To fix the scroll position resetting on zoom, I think we need something from
// https://github.com/scratchfoundation/scratch-blocks/blob/8aa52c48393bfb91ef63f91bc1df4a030563237a/core/scrollbar.js#L87
// or
// https://github.com/scratchfoundation/scratch-blocks/blob/8aa52c48393bfb91ef63f91bc1df4a030563237a/core/scrollbar.js#L418
// But I am not sure...

export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  console.log(ScratchBlocks);
  console.log(addon.self.disabled);

  const oldScroll = ScratchBlocks.WorkspaceSvg.prototype.scroll;
  const oldDrag = ScratchBlocks.WorkspaceDragger.prototype.drag;

  ScratchBlocks.WorkspaceSvg.prototype.scroll = function (x, y) {
    if (addon.self.disabled) {
      oldScroll.call(this, x, y);
    } else {
      var metrics = this.startDragMetrics; // Cached values

      ScratchBlocks.WidgetDiv.hide(true);
      ScratchBlocks.DropDownDiv.hideWithoutAnimation();
      this.scrollbar.set(-x - metrics.contentLeft, -y - metrics.contentTop);
    }
  };

  ScratchBlocks.WorkspaceDragger.prototype.drag = function (currentDragDeltaXY) {
    if (addon.self.disabled) {
      oldDrag.call(this, currentDragDeltaXY);
    } else {
      var metrics = this.startDragMetrics_;

      var newXY = {
        x: this.startScrollXY_.x + currentDragDeltaXY.x,
        y: this.startScrollXY_.y + currentDragDeltaXY.y,
      };

      var x = newXY.x;
      var y = newXY.y;

      x = -x - metrics.contentLeft;
      y = -y - metrics.contentTop;

      this.updateScroll_(x, y);
    }
  };
}
