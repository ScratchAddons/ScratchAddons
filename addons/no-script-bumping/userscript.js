export default async function ({ addon, console, fetch }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalBumpNeighbors = ScratchBlocks.BlockSvg.prototype.bumpNeighbours_;
  ScratchBlocks.BlockSvg.prototype.bumpNeighbours_ = function () {
    if (addon.self.disabled) {
      originalBumpNeighbors.call(this);
    }
  };
}
