import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");

  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalRender = ScratchBlocks.BlockSvg.prototype.render;
  ScratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    const shade = addon.settings.get("shade");
    const intensity = addon.settings.get("intensity");
    const amount = ((shade === "lighter" ? 1 : -1) * intensity) / 2;

    // Any changes that affect block striping should bubble to the top block of the script.
    // The top block of the script is responsible for striping all of its children.
    // This way stripes are computed exactly once.
    if (
      // addon is enabled
      !addon.self.disabled &&
      // not in the flyout
      !this.isInFlyout &&
      // not a shadow
      !this.isShadow() &&
      // not an insertion marker
      !this.isInsertionMarker() &&
      // does not have parent
      this.getParent() === null
    ) {
      // getDescendants() returns blocks in an order such that each block's parent
      // will always come before that block (except the first block which has no parent).
      for (const block of this.getDescendants()) {
        const parent = block.getSurroundParent();

        const shouldStripe =
          // not a insertion marker
          !block.isInsertionMarker() &&
          // has a parent
          parent &&
          // shadow blocks should be striped if it's parent is striped.
          (block.isShadow()
            ? parent.saStriped
            : // parent and child are same color (even shadows match block color)
              // we dont check category because other addons can make blocks the same color.
              // if the block was stripped we need to look at it's original color in order to get it's real color.
              parent.getColour() === (block.saOriginalColour ? block.saOriginalColour[0] : block.getColour()) &&
              // non-shadow blocks should be striped if its parent isn't striped.
              !parent.saStriped);

        // if the block's stripe state is correct, no need to update its state.
        // if a block has never been stripped (undefined) and shouldStripe is false, the code below won't run
        if (shouldStripe === Boolean(block.saStriped)) continue;

        if (!shouldStripe && block.saOriginalColour) {
          block.setColour(...block.saOriginalColour);
          block.saOriginalColour = null;
        } else if (shouldStripe && !block.saOriginalColour) {
          const color = block.getColour();
          const secondary = block.getColourSecondary();
          const tertiary = block.getColourTertiary();
          const quaternary = block.getColourQuaternary();
          block.saOriginalColour = [color, secondary, tertiary, quaternary];

          const stripedColors = block.saOriginalColour.map((c) => "#" + tinycolor(c).lighten(amount).toHex());
          block.setColour(...stripedColors);
        }

        // field dropdowns in non shadow blocks don't automatically update when setColour is called.
        if (!block.isShadow()) {
          for (const input of block.inputList) {
            for (const field of input.fieldRow) {
              if (field instanceof ScratchBlocks.FieldDropdown) {
                field.box_.setAttribute("fill", field.sourceBlock_.getColour());
                field.box_.setAttribute("stroke", field.sourceBlock_.getColourTertiary());
              }
            }
          }
        }
        block.saStriped = shouldStripe;
      }
    }
    return originalRender.call(this, opt_bubble);
  };

  if (addon.self.enabledLate) updateAllBlocks(addon.tab, { updateFlyout: false });
  addon.self.addEventListener("disabled", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
  addon.self.addEventListener("reenabled", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
  addon.settings.addEventListener("change", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
}
