export default async function ({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // Rerender the dragged block when updating the insertion marker
  const ogConnectMarker = ScratchBlocks.InsertionMarkerManager.prototype.connectMarker_;
  ScratchBlocks.InsertionMarkerManager.prototype.connectMarker_ = function () {
    ogConnectMarker.call(this);
    if (!addon.self.disabled && this.firstMarker_) {
      const block = this?.workspace_?.currentGesture_?.blockDragger_?.draggingBlock_;
      block.noMoveConnection = true;
      if (block) block.render(false);
    }
  };
  const ogDisconnectMarker = ScratchBlocks.InsertionMarkerManager.prototype.disconnectMarker_;
  ScratchBlocks.InsertionMarkerManager.prototype.disconnectMarker_ = function () {
    ogDisconnectMarker.call(this);
    if (!addon.self.disabled && this.firstMarker_) {
      const block = this?.workspace_?.currentGesture_?.blockDragger_?.draggingBlock_;
      block.noMoveConnection = true;
      if (block) block.render(false);
    }
  };

  const ogDraw = ScratchBlocks.BlockSvg.prototype.renderDraw_;
  const ogMoveConnections = ScratchBlocks.BlockSvg.prototype.renderMoveConnections_;
  ScratchBlocks.BlockSvg.prototype.renderDraw_ = function (iconWidth, inputRows) {
    if (addon.self.disabled) return ogDraw.call(this, iconWidth, inputRows);

    // If the block contains a statement (C) input and has an insertion marker,
    // use that to calculate the height of the statement inputs
    let computeBlock = this;
    if (this?.workspace?.currentGesture_?.blockDragger_?.draggedConnectionManager_) {
      const dragger = this.workspace.currentGesture_.blockDragger_;
      const manager = dragger.draggedConnectionManager_;
      if (
        manager.markerConnection_ &&
        manager.firstMarker_ &&
        dragger.draggingBlock_ == this &&
        dragger.draggingBlock_.type == manager.firstMarker_.type
      ) {
        if (inputRows.some((row) => row.some((input) => input.type === ScratchBlocks.NEXT_STATEMENT))) {
          computeBlock = manager.firstMarker_;
        }
      }
    }

    // Change the height of substacks
    // (If we set inputRows to computeBlock.renderCompute_,
    // the references to the inputs would be wrong
    // so they just won't update properly)
    if (computeBlock !== this) {
      const _inputRows = computeBlock.renderCompute_(iconWidth);
      for (let i = 0; i < inputRows.length; i++) {
        const row = inputRows[i];
        let update = false;
        for (const input of row) {
          if (input.type === ScratchBlocks.NEXT_STATEMENT) update = true;
        }
        if (update) row.height = Math.max(row.height, _inputRows[i].height);
      }
    }

    ogDraw.call(this, iconWidth, inputRows);

    // Moving the connections of a block while it's being dragged breaks it,
    // so don't
    if (computeBlock === this && !this.noMoveConnection) ogMoveConnections.call(this);
    this.noMoveConnection = false;
  };
  ScratchBlocks.BlockSvg.prototype.renderMoveConnections_ = function () {
    if (addon.self.disabled) return ogMoveConnections.call(this);
    // Do nothing (this function is instead called by renderDraw_)
  };
}
