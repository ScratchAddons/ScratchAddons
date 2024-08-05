import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");

  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalRender = ScratchBlocks.BlockSvg.prototype.render;
  ScratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    // Any changes that affect block striping should bubble to the top block of the script.
    // The top block of the script is responsible for striping all of its children.
    // This way stripes are computed exactly once.
    if (
      !addon.self.disabled &&
      !this.isInFlyout &&
      !this.isShadow() &&
      !this.isInsertionMarker() &&
      this.getParent() === null
    ) {
      const shade = addon.settings.get("shade");
      const intensity = addon.settings.get("intensity");
      const amount = ((shade === "lighter" ? 1 : -1) * intensity) / 2;
      // Conveniently getDescendants() returns blocks in an order such that each block's
      // parent will always come before that block (except the first block which has no
      // parent).
      for (const block of this.getDescendants()) {
        const parent = block.getSurroundParent();
        let wasStripped = !!block.sa_striped;
        // Ensure the shadow block has the correct stroke by updating it's color to match parent colors.
        if (block.isShadow() && !parent.sa_striped) {
          block.updateColour();
          continue;
        }
        block.sa_striped =
          // not a shadow
          !block.isShadow() &&
          // not a insertion marker
          !block.isInsertionMarker() &&
          // has a parent
          parent &&
          // parent is not striped
          !parent.sa_striped &&
          // parent and child are same color
          // we dont check category because other addons can make blocks the same color.
          // if the block was stripped we need to look at it's original color in order to get it's real color
          parent.getColour() === (block.sa_orginalColour ? block.sa_orginalColour[0] : block.getColour());

        if (!block.sa_striped && block.sa_orginalColour) {
          block.setColour(...block.sa_orginalColour);
          block.sa_orginalColour = null;
        } else if (block.sa_striped && !block.sa_orginalColour) {
          const color = block.getColour();
          const secondary = block.getColourSecondary();
          const tertiary = block.getColourTertiary();
          const quaternary = block.getColourQuaternary();

          block.sa_orginalColour = [color, secondary, tertiary, quaternary];
          block.setColour(
            "#" + tinycolor(color).lighten(amount).toHex(),
            "#" + tinycolor(secondary).lighten(amount).toHex(),
            "#" + tinycolor(tertiary).lighten(amount).toHex(),
            "#" + tinycolor(quaternary).lighten(amount).toHex()
          );
        }

        if (wasStripped !== block.sa_striped) {
          // Update field dropdowns to match parent color
          for (const input of block.inputList) {
            for (const field of input.fieldRow) {
              if (field instanceof ScratchBlocks.FieldDropdown) {
                field.box_.setAttribute("fill", field.sourceBlock_.getColour());
                field.box_.setAttribute("stroke", field.sourceBlock_.getColourTertiary());
              }
            }
          }
        }
      }
    }
    return originalRender.call(this, opt_bubble);
  };

  if (addon.self.enabledLate) updateAllBlocks(addon.tab, { updateFlyout: false });
  addon.self.addEventListener("disabled", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
  addon.self.addEventListener("reenabled", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
  addon.settings.addEventListener("change", () => updateAllBlocks(addon.tab, { updateFlyout: false }));
}
