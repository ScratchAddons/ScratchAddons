export default async function ({ addon, msg, global, console }) {
  if (addon.tab.editorMode === "embed") {
    return;
  }

  addon.tab.redux.initialize();
  const scratchBlocks = await addon.tab.traps.getBlockly();

  // Get the *real* parent of a block (the block it's in), as Scratch also
  // considers the previous block to be its parent.
  function realParentOfBlock(block) {
    if (!block) return null;
	
	const parentBlock = block.getParent();
    if (!parentBlock) return null;

    if (parentBlock.nextConnection?.targetConnection?.sourceBlock_ === block) {
      // This may be a stack block under a stack block in a C
      // block - look further!
      return realParentOfBlock(parentBlock);
    }
    return parentBlock;
  }

  // Check if a block is to be striped, and cache the result
  // for better performance.
  function blockIsStriped(block) {
    if (!block) return null;

    if (block.__zebra !== null && block.__zebra !== undefined) {
      // Striping was already calculated; just return it
      return block.__zebra;
    }

    const parentBlock = realParentOfBlock(block);
    if (!parentBlock) {
      // Blocks not in another block will always be normal
      block.__zebra = false;
      return block.__zebra;
    }

    if (block.getColour() !== parentBlock.getColour()) {
      // Blocks with different colors will always be normal
	  // (But if, for example, a music reporter is put into
	  // a pen block, it will be striped)
      block.__zebra = false;
      return block.__zebra;
    }
	
    if (parentBlock.__zebra !== null && parentBlock.__zebra !== undefined) {
      // The parent's striping was already calculated;
      // just inherit that and invert if neccessary
      if (block.isShadow_) {
		block.__zebra = parentBlock.__zebra;
	  } else {
		block.__zebra = !parentBlock.__zebra;
	  }
      return block.__zebra;
    }

    // The parent's striping hasn't been calculated yet;
    // calculate that then invert the result if necessary
    if (block.isShadow_) {
		block.__zebra = blockIsStriped(parentBlock);
	} else {
		block.__zebra = !blockIsStriped(parentBlock);
	}
    return block.__zebra;
  }

  // Calculate and apply striping for a block and all blocks
  // below and in it.
  function stripeScript(block) {
	  if (!block) return;
    block.__zebra = null;
	
    const el = block.getSvgRoot();
    const isStriped = blockIsStriped(block);
    if (el) {
      stripeStyling(el, isStriped);
    }
	
    for (const child of block.childBlocks_) {
      stripeScript(child);
    }
  }

  // Add or remove the striping class from a block element.
  function stripeStyling(el, isStriped) {
    // We iterate through all children of the block element instead of
    // simply adding the class to the path so that empty boolean inputs
    // are lighter too
    for (const child of el.children) {
      if (child.matches(".blocklyPath, .blocklyEditableText[data-argument-type='dropdown']")) {
        if (isStriped) {
          child.classList.add("sa-zebra-stripe");
        } else {
          child.classList.remove("sa-zebra-stripe");
        }
      }
    }
  }

  // Calculate and apply striping for all blocks in the code area.
  function stripeAll() {
    const ws = scratchBlocks.getMainWorkspace();
	if (!ws) return;
	
    for (const block of ws.getAllBlocks()) {
      // Clear stored striping
      block.__zebra = null;
	
      const el = block.getSvgRoot();
      if (!el) continue;

      const isStriped = blockIsStriped(block);
      stripeStyling(el, isStriped);
    }
  }

  function stripeSelected() {
    const selected = document.querySelector(".blocklySelected");
	  const ws = scratchBlocks.getMainWorkspace();
    if (!(ws && selected)) {
      stripeAll();
      return;
    }
    if (!selected.dataset.id) return;
    stripeScript(ws.getBlockById(selected.dataset.id));
  }

  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (addon.self.disabled) return;
    if (e.detail.action.type === "scratch-gui/toolbox/UPDATE_TOOLBOX") {
      // Switching sprites
      queueMicrotask(stripeAll);
    }
  });
  addon.self.addEventListener("reenabled", stripeAll);

  if (addon.tab.editorMode === "editor") {
	  // The editor has already loaded, stripe immediately
	  queueMicrotask(stripeAll);
  }
  
  scratchBlocks.getMainWorkspace().addChangeListener((e) => {
    if (addon.self.disabled) return;
	  if (e.type === "move") {
		  const ws = scratchBlocks.getMainWorkspace();
		stripeScript(ws.getBlockById(e.blockId));
	  }
  })
}
