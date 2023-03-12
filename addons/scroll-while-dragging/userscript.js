export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // We have to override call because onMouseWheel_ is passed
  // as an argument to Blockly.bindEventWithChecks_
  const wheel = ScratchBlocks.WorkspaceSvg.prototype.onMouseWheel_;
  wheel.call = function (_this, e) {
    if (addon.self.disabled) {
      return wheel.apply(_this, [e]);
    }

    // Pasted mostly from scratch-blocks
    // (in vanilla, a check for this.currentGesture_ would be here)

    // Multiplier variable, so that non-pixel-deltaModes are supported.
    // See LLK/scratch-blocks#1190.
    var multiplier = e.deltaMode === 0x1 ? ScratchBlocks.LINE_SCROLL_MULTIPLIER : 1;

    const oldScrollX = _this.scrollX;
    const oldScrollY = _this.scrollY;

    if (e.ctrlKey) {
      // The vertical scroll distance that corresponds to a click of a zoom button.
      var PIXELS_PER_ZOOM_STEP = 50;
      var delta = (-e.deltaY / PIXELS_PER_ZOOM_STEP) * multiplier;
      var position = ScratchBlocks.utils.mouseToSvg(e, _this.getParentSvg(), _this.getInverseScreenCTM());

      const oldScale = _this.scale;

      _this.zoom(position.x, position.y, delta);

      if (_this.currentGesture_ && !addon.self.disabled) {
        // for now, don't allow zooming while dragging a block
        // (I don't think it is as needed as scrolling anyways)
        _this.currentGesture_.cancel();
        /*
          const gesture = _this.currentGesture_;
          const Coordinate = gesture.currentDragDeltaXY_.constructor;

          const deltaOffX = (gesture.currentDragDeltaXY_.x / oldScale) * _this.scale - gesture.currentDragDeltaXY_.x;
          const deltaOffY = (gesture.currentDragDeltaXY_.y / oldScale) * _this.scale - gesture.currentDragDeltaXY_.y;

          gesture.mouseDownXY_ = new Coordinate(
            gesture.mouseDownXY_.x - (_this.scrollX - oldScrollX) - deltaOffX,
            gesture.mouseDownXY_.y - (_this.scrollY - oldScrollY) - deltaOffY
          );
        */
      }
    } else {
      // This is a regular mouse wheel event - scroll the workspace
      // First hide the WidgetDiv without animation
      // (mouse scroll makes field out of place with div)
      ScratchBlocks.WidgetDiv.hide(true);
      ScratchBlocks.DropDownDiv.hideWithoutAnimation();

      var x = _this.scrollX - e.deltaX * multiplier;
      var y = _this.scrollY - e.deltaY * multiplier;

      if (e.shiftKey && e.deltaX === 0) {
        // Scroll horizontally (based on vertical scroll delta)
        // This is needed as for some browser/system combinations which do not
        // set deltaX. See LLK/scratch-blocks#1662.
        x = _this.scrollX - e.deltaY * multiplier;
        y = _this.scrollY; // Don't scroll vertically
      }

      _this.startDragMetrics = _this.getMetrics();
      _this.scroll(x, y);
    }

    const deltaX = _this.scrollX - oldScrollX;
    const deltaY = _this.scrollY - oldScrollY;

    const gesture = _this.currentGesture_;
    if (
      !addon.self.disabled &&
      gesture &&
      gesture.mostRecentEvent_ &&
      (gesture.mostRecentEvent_.type === "mousemove" || gesture.mostRecentEvent_.type === "touchmove")
    ) {
      const Coordinate = gesture.mouseDownXY_.constructor;

      // Hack to move the dragged blocks
      gesture.mouseDownXY_ = new Coordinate(gesture.mouseDownXY_.x + deltaX, gesture.mouseDownXY_.y + deltaY);

      // Make scratch-blocks update the dragging again
      document.dispatchEvent(gesture.mostRecentEvent_);
    }

    e.preventDefault();
  };

  const originalBounds = ScratchBlocks.WorkspaceSvg.prototype.getBlocksBoundingBox;
  ScratchBlocks.WorkspaceSvg.prototype.getBlocksBoundingBox = function () {
    // "Store" bounds while dragging something,
    // to prevent the workspace expanding too much
    // (causing errors)
    if (
      addon.self.disabled ||
      !this.storedBounds ||
      !this.currentGesture_ ||
      this.currentGesture_.isDraggingWorkspace_
    ) {
      this.storedBounds = originalBounds.call(this);
    }
    return this.storedBounds;
  };
}
