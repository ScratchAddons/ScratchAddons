export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");

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
          // not a shadow
          !block.isShadow() &&
          // not a insertion marker
          !block.isInsertionMarker() &&
          // has a parent
          parent &&
          // parent is not striped
          !parent.striped &&
          // parent and child are same category
          parent.getCategory() === block.getCategory() &&
          // block has a substack (wrap blocks)
          (block.inputList.some((i) => i.name === "SUBSTACK") ||
            // block has a output shape (reporter/boolean) and is same as parent's
            (block.outputShape_ > 0 && block.outputShape_ === parent.outputShape_));
        if (!block.striped && block.orginalColour_) {
          block.setColour(block.orginalColour_);
          block.orginalColour_ = null;
        } else if (block.striped && !block.orginalColour_) {
          const color = block.getColour();
          block.orginalColour_ = color;
          const shade = addon.settings.get("shade");
          const intensity = addon.settings.get("intensity");
          const amount = ((shade === "lighter" ? 1 : -1) * intensity) / 2;
          block.setColour("#" + tinycolor(color).lighten(amount).toHex());
        }
      }
    }
    return originalRender.call(this, opt_bubble);
  };

  function updateWorkspaceBlocks() {
    const workspace = addon.tab.traps.getWorkspace();
    ScratchBlocks.Events.disable();
    ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(ScratchBlocks.Xml.workspaceToDom(workspace), workspace);
    workspace.toolboxRefreshEnabled_ = true;
    ScratchBlocks.Events.enable();
  }

  if (addon.self.enabledLate) updateWorkspaceBlocks();
  addon.self.addEventListener("disabled", updateWorkspaceBlocks);
  addon.self.addEventListener("reenabled", updateWorkspaceBlocks);
  addon.settings.addEventListener("change", updateWorkspaceBlocks);
}
