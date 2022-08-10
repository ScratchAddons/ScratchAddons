export default async function ({ addon, msg, global, console }) {
  const vm = addon.tab.traps.vm;
  const scratchBlocks = await addon.tab.traps.getBlockly();
  const _render = scratchBlocks.BlockSvg.prototype.render;
  scratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    if (!this.isInFlyout && !this.isShadow_) {
      let block = this;
      while (block.getSurroundParent() && block.getSurroundParent().category_ === block.category_) {
        block = block.getSurroundParent();
      }

      for (const b of block.getDescendants()) {
        const parent = b.getSurroundParent();

        const zebra = parent ? (b.isShadow_ ? parent.zebra : !parent.zebra) : false;
        if (b.isShadow_ || !parent || (parent && parent.category_ === b.category_)) {
          const els = [b.svgPath_];
          for (const input of b.inputList) {
            if (input.outlinePath) {
              els.push(input.outlinePath);
            }
            for (const field of input.fieldRow) {
              if (field.fieldGroup_) {
                els.push(field.fieldGroup_);
              }
            }
          }
          for (const el of els) {
            if (!zebra && b.zebra) {
              el.classList.remove("sa-zebra-stripe");
            }
            if (zebra && !b.zebra) {
              el.classList.add("sa-zebra-stripe");
            }
          }
          b.zebra = zebra;
        }
      }
    }
    _render.call(this, opt_bubble);
  };

  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
}
