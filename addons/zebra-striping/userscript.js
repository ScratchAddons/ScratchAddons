export default async function ({ addon, msg, global, console }) {
  const vm = addon.tab.traps.vm;
  const scratchBlocks = await addon.tab.traps.getBlockly();
  const _render = scratchBlocks.BlockSvg.prototype.render;
  
  scratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    if (!this.isInFlyout && !this.isShadow()) {
      let block = this;
      while (block.getSurroundParent() && block.getSurroundParent().getCategory() === block.getCategory()) {
        block = block.getSurroundParent();
      }

      for (const b of block.getDescendants()) {
        const parent = b.getSurroundParent();

        const zebra = parent ? (b.isShadow() ? parent.zebra : !parent.zebra) : false;
        if (b.isShadow() || !parent || (parent && parent.getCategory() === b.getCategory())) {
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
  
  // The replacement glow filter's ID is randomly generated and changes
  // when the workspace is reloaded (which includes loading the page and
  // seeing the project page then seeing inside).
  // As we need to stack the filter with the striping filter in the
  // userstyle, we need to use the usersciript to get the filter's ID
  // and set a CSS variable on the document's root.
  while (true) {
  const replacementGlowEl = await addon.tab.waitForElement(
	'filter[id*="blocklyReplacementGlowFilter"]', {
		markAsSeen: true
	}
  );
	document.documentElement.style.setProperty(
	"--zebraStriping-replacementGlow",
	`url(#${replacementGlowEl.id})`
	);
  }
}
