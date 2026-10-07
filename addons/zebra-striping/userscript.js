import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";

export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const originalRender = ScratchBlocks.BlockSvg.prototype.renderEfficiently;
  ScratchBlocks.BlockSvg.prototype.renderEfficiently = function (...args) {
    // Any changes that affect block striping should bubble to the top block of the script.
    // The top block of the script is responsible for striping all of its children.
    // This way stripes are computed exactly once.
    if (!this.isInFlyout && !this.isShadow() && this.getParent() === null) {
      const stripeState = new Map();
      // Conveniently getDescendants() returns blocks in an order such that each block's
      // parent will always come before that block (except the first block which has no
      // parent).
      for (const block of this.getDescendants()) {
        const parent = block.getSurroundParent();

        let isStriped = false;
        if (parent) {
          if (block.isShadow()) {
            isStriped = !!stripeState.get(parent);
          } else if (parent.getColour() === block.getColour()) {
            isStriped = !stripeState.get(parent);
          }
        }
        stripeState.set(block, isStriped);

        const elements = [block.pathObject.svgPath];
        if (block.type !== "procedures_prototype") {
          if (block.pathObject.svgPathSelected) {
            elements.push(block.pathObject.svgPathSelected);
          }
          for (const outlinePath of block.pathObject.outlines.values()) {
            elements.push(outlinePath);
          }
          for (const input of block.inputList) {
            for (const field of input.fieldRow) {
              if (field.fieldGroup_) {
                elements.push(field.fieldGroup_);
              }
            }
          }
        }
        for (const el of elements) {
          el.classList.toggle("sa-zebra-stripe", isStriped);
        }
      }
    }
    return originalRender.call(this, ...args);
  };

  updateAllBlocks(addon.tab, { updateFlyout: false });

  // The replacement glow filter's ID is randomly generated and changes
  // when the workspace is reloaded (which includes loading the page and
  // seeing the project page then seeing inside).
  // As we need to stack the filter with the striping filter in the
  // userstyle, we need to use the userscript to get the filter's ID
  // and set a CSS variable on the document's root.
  while (true) {
    const replacementGlowEl = await addon.tab.waitForElement('filter[id*="blocklyReplacementGlowFilter"]', {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/settings/SET_COLOR_MODE",
        "scratch-gui/settings/SET_THEME",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    document.documentElement.style.setProperty("--zebraStriping-replacementGlow", `url(#${replacementGlowEl.id})`);
  }
}
