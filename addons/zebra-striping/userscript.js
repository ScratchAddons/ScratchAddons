export default async function ({ addon, msg, global, console }) {
  const vm = addon.tab.traps.vm;
  const scratchBlocks = await addon.tab.traps.getBlockly();

  /**
   * Returns the direct children of a block and the siblings of those children.
   * For the script:
   * repeat ((1) + (2)) {
   *   move (10) steps
   *   repeat (5) {
   *     ...
   *   }
   * }
   * say (Hello)
   * Calling this function on the top repeat block would return:
   *  - the addition block (but not its inputs)
   *  - the move steps block (but not its inputs)
   *  - the second repeat block (but not its inputs or children)
   * @returns {unknown[]}
   */
  const getImmediateDescendants = (block) => {
    const blocks = [];
    // getChildren() will also return the next block which we don't want to include
    const blockNext = block.getNextBlock();
    for (let childBlock of block.getChildren()) {
      while (childBlock && childBlock !== blockNext) {
        blocks.push(childBlock);
        childBlock = childBlock.getNextBlock();
      }
    }
    return blocks;
  };

  const originalRender = scratchBlocks.BlockSvg.prototype.render;
  scratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    if (!this.isInFlyout && !this.isShadow()) {
      const surroundingParent = this.getSurroundParent();
      const category = this.getCategory();
      const isTop = !surroundingParent || (surroundingParent.getCategory() !== category);

      // The "top block" is responsible for determining which of its children should be striped.
      // All modifications that can change whether a block should be striped should bubble up to the
      // top block.
      if (isTop) {
        let zebra = false;
        let blocks = [this];
        let nextBlocks = [];

        while (blocks.length) {
          for (const block of blocks) {
            for (const child of getImmediateDescendants(block)) {
              if (!child.isShadow() && child.getCategory() === category) {
                nextBlocks.push(child);
              }
            }

            const stripedElements = [block.svgPath_];
            for (const input of block.inputList) {
              if (input.outlinePath) {
                stripedElements.push(input.outlinePath);
              }
              for (const field of input.fieldRow) {
                if (field.fieldGroup_) {
                  stripedElements.push(field.fieldGroup_);
                }
              }
            }
            for (const el of stripedElements) {
              el.classList.toggle("sa-zebra-stripe", zebra);
            }
          }

          zebra = !zebra;
          blocks = nextBlocks;
          nextBlocks = [];
        }
      }
    }
    return originalRender.call(this, opt_bubble);
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
    const replacementGlowEl = await addon.tab.waitForElement('filter[id*="blocklyReplacementGlowFilter"]', {
      markAsSeen: true,
    });
    document.documentElement.style.setProperty("--zebraStriping-replacementGlow", `url(#${replacementGlowEl.id})`);
  }
}
