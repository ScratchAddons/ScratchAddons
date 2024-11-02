export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  if (ScratchBlocks.registry) {
    // New Blockly
    const originalBumpNeighbors = ScratchBlocks.BlockSvg.prototype.bumpNeighbours;
    ScratchBlocks.BlockSvg.prototype.bumpNeighbours = function () {
      if (addon.self.disabled) originalBumpNeighbors.call(this);
    };
  } else {
    const originalBumpNeighbors = ScratchBlocks.BlockSvg.prototype.bumpNeighbours_;
    ScratchBlocks.BlockSvg.prototype.bumpNeighbours_ = function () {
      if (addon.self.disabled) {
        originalBumpNeighbors.call(this);
      }
    };
  }
}
