export default async function ({ addon, msg, global, console }) {
  const vm = addon.tab.traps.vm;
  const scratchBlocks = await addon.tab.traps.getBlockly();
  const _render = scratchBlocks.BlockSvg.prototype.render;
  scratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    console.log(this.isShadow_);
    if (!this.isInFlyout && !this.isShadow_) {
      let block = this;
      while (block.getSurroundParent() && block.getSurroundParent().type === block.type) {
        block = block.getSurroundParent();
      }

      function zebra(block, z) {
        if (block.zebra && !z) {
          block.svgPath_.classList.remove("sa-zebra-stripe");
        }
        block.zebra = z;
        if (z) {
          block.svgPath_.classList.add("sa-zebra-stripe");
        }
        for (const b of block.childBlocks_) {
          const parent = b.getSurroundParent();
          if (parent && !b.isShadow_ && parent.type === b.type) {
            zebra(b, !parent.zebra);
          }
        }
      }
      zebra(block, false);
    }
    _render.call(this, opt_bubble);
  };

  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
}
