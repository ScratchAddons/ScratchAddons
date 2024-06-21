export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalRender = ScratchBlocks.BlockSvg.prototype.render;
  ScratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    // Any changes that affect block striping should bubble to the top block of the script.
    // The top block of the script is responsible for striping all of its children.
    // This way stripes are computed exactly once.
    if (!addon.self.disabled && !this.isInFlyout && !this.isShadow() && this.getParent() === null) {
      // Conveniently getDescendants() returns blocks in an order such that each block's
      // parent will always come before that block (except the first block which has no
      // parent).
      for (const block of this.getDescendants()) {
        const parent = block.getSurroundParent();
        block.striped =
          // not a shadow block
          !block.isShadow() &&
          // has a parent
          parent &&
          // parent is not striped
          !parent.striped &&
          // parent and child are same category
          parent.getCategory() === block.getCategory() &&
          // not a stack block
          (block.nextConnection || (block.outputShape_ > 0 && block.outputShape_ === parent.outputShape_));
        if (!block.striped && block.orginalColour_) {
          block.setColour(block.orginalColour_);
          block.orginalColour_ = null;
        } else if (block.striped && !block.orginalColour_) {
          block.orginalColour_ = block.colour_;
          const shade = addon.settings.get("shade");
          const intensity = addon.settings.get("intensity");
          const amount = (shade === "lighter" ? 1 : -1) * intensity;
          block.setColour(lighten(block.colour_, amount));
        }
      }
    }
    return originalRender.call(this, opt_bubble);
  };
  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
  addon.self.addEventListener("disabled", () => vm.emitWorkspaceUpdate());
  addon.self.addEventListener("reenabled", () => vm.emitWorkspaceUpdate());
  addon.settings.addEventListener("change", () => vm.emitWorkspaceUpdate());
}

function lighten(color, amount) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        ("0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
      )
  );
}
