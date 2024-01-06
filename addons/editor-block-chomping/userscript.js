export default async function ({ addon, msg, console }) {
	const ScratchBlocks = await addon.tab.traps.getBlockly();

	const ogConnectMarker = ScratchBlocks.InsertionMarkerManager.prototype.connectMarker_;
	ScratchBlocks.InsertionMarkerManager.prototype.connectMarker_ = function() {
		ogConnectMarker.call(this);
		if (this.firstMarker_) {
			const block = this?.workspace_?.currentGesture_?.blockDragger_?.draggingBlock_;
			if (block) block.render(false);
		}
	}
	const ogDisconnectMarker = ScratchBlocks.InsertionMarkerManager.prototype.disconnectMarker_;
	ScratchBlocks.InsertionMarkerManager.prototype.disconnectMarker_ = function() {
		ogDisconnectMarker.call(this);
		if (this.firstMarker_) {
			const block = this?.workspace_?.currentGesture_?.blockDragger_?.draggingBlock_;
			block.noMoveConnection = true;
			if (block) block.render(false);
		}
	}

	const ogDraw = ScratchBlocks.BlockSvg.prototype.renderDraw_;
	const ogMoveConnections = ScratchBlocks.BlockSvg.prototype.renderMoveConnections_;
	ScratchBlocks.BlockSvg.prototype.renderDraw_ = function(iconWidth, inputRows) {
		if (addon.self.disabled) return ogDraw.call(this, iconWidth, inputRows);

		let computeBlock = this;
		if (this?.workspace?.currentGesture_?.blockDragger_?.draggedConnectionManager_) {
			const dragger = this.workspace.currentGesture_.blockDragger_;
			const manager = dragger.draggedConnectionManager_;
			if (manager.markerConnection_ && manager.firstMarker_ && dragger.draggingBlock_ == this && dragger.draggingBlock_.type == manager.firstMarker_.type) {
				computeBlock = manager.firstMarker_;
			}
		}
		// change the height of substacks
		// (if we set inputRows to computeBlock.renderCompute_,
		// the references to the inputs would be wrong
		// so they just won't update properly)
		if (computeBlock !== this) {
			const _inputRows = computeBlock.renderCompute_(iconWidth);
			for (let i = 0; i < inputRows.length; i++) {
				const row = inputRows[i];
				row.height = _inputRows[i].height;
			}
		}

		ogDraw.call(this, iconWidth, inputRows);
		if (computeBlock === this && !this.noMoveConnection) ogMoveConnections.call(this);
		this.noMoveConnection = false;
	};
	ScratchBlocks.BlockSvg.prototype.renderMoveConnections_ = function() {
		if (addon.self.disabled) return ogDraw.call(this);
		// do nothing (this function is instead called by renderDraw_)
	};
}
