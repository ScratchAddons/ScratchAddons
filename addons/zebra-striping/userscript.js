export default async function ({ addon, msg, global, console }) {
  if (addon.tab.editorMode === "embed") {
    return;
  }

  addon.tab.redux.initialize();
  const vm = addon.tab.traps.vm;

  // Get the *real* parent of a block (the block it's in), as Scratch also
  // considers the previous block to be its parent.
  function realParentOfBlock(target, id) {
    if (!target) return null;
    if (!id) return;
    const block = target.blocks._blocks[id];
    if (!block) return null;

    if (block.topLevel) return null;

    const parentId = block.parent;
    if (!parentId) return null;

    const parentBlock = target.blocks._blocks[parentId];

    const inputValues = Object.values(parentBlock.inputs);

    const found = inputValues.find((el) => el.block === id);

    if (!found) {
      // This may be a stack block under a stack block in a C
      // block - look further!
      return realParentOfBlock(target, parentId);
    }

    return parentBlock;
  }

  // Check if a block is to be striped, and cache the result
  // for better performance.
  function blockIsStriped(target, id) {
    const block = target.blocks._blocks[id];
    if (!block) return null;

    if (block.__zebra !== null && block.__zebra !== undefined) {
      // Striping was already calculated; just return it
      return block.__zebra;
    }

    const parentBlock = realParentOfBlock(target, id);
    if (!parentBlock) {
      // Blocks not in another block will always be normal
      block.__zebra = false;
      return block.__zebra;
    }

    const extension = block.opcode.split("_")[0];
    const parentExtension = parentBlock.opcode.split("_")[0];
    if (extension !== parentExtension) {
      // Blocks from different categories will always be normal
      block.__zebra = false;
      return block.__zebra;
    }

    if (parentBlock.__zebra !== null && parentBlock.__zebra !== undefined) {
      // The parent's striping was already calculated;
      // just invert that
      block.__zebra = !parentBlock.__zebra;
      return block.__zebra;
    }

    // The parent's striping hasn't been calculated yet;
    // calculate that then invert the result
    block.__zebra = !blockIsStriped(target, parentBlock.id);
    return block.__zebra;
  }

  // Calculate and apply striping for a block and all blocks
  // below and in it.
  function stripeScript(target, id) {
    const ws = Blockly.getMainWorkspace();

    const block = target.blocks._blocks[id];
    if (!block) return;
    block.__zebra = null;

    const el = ws.getBlockById(id).getSvgRoot();
    const isStriped = blockIsStriped(target, id);
    if (el) {
      stripeStyling(el, isStriped);
    }

    if (block.next) {
      stripeScript(target, block.next);
    }
    const inputs = Object.values(target.blocks._blocks[id].inputs);
    for (const i in inputs) {
      const input = inputs[i];
      if (input.block) {
        stripeScript(target, input.block);
      }
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
    const editingTarget = vm.editingTarget;
    if (!editingTarget) return;

    const allBlocks = editingTarget.blocks._blocks;
    // Calling and looping through a querySelectorAll probably has
    // perf impact. I'll uncomment this if stuff doesn't unstripe properly
    // sometimes
    /* document.querySelectorAll(".sa-zebra-stripe").forEach(el => {
			el.classList.remove("sa-zebra-stripe");
		}); */

    const ws = Blockly.getMainWorkspace();

    for (const blockId in allBlocks) {
      // Clear stored striping
      allBlocks[blockId].__zebra = null;

      const el = ws.getBlockById(blockId).getSvgRoot();
      if (!el) continue;

      const isStriped = blockIsStriped(editingTarget, blockId);
      stripeStyling(el, isStriped);
    }
  }

  function stripeSelected() {
    const selected = document.querySelector(".blocklySelected");
    if (!selected) {
      stripeAll();
      return;
    }
    if (!selected.dataset.id) return;
    stripeScript(vm.editingTarget, selected.dataset.id);
  }

  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (addon.self.disabled) return;

    if (
      e.detail.action.type === "scratch-gui/project-changed/SET_PROJECT_CHANGED" ||
      e.detail.action.type === "scratch-gui/block-drag/BLOCK_DRAG_UPDATE"
    ) {
      queueMicrotask(stripeSelected);
    }
    if (e.detail.action.type === "scratch-gui/toolbox/UPDATE_TOOLBOX") {
      // Switching sprites
      queueMicrotask(stripeAll);
    }
  });
  addon.self.addEventListener("reenabled", stripeAll);

  if (addon.tab.editorMode === "editor") {
    queueMicrotask(stripeAll);
  }
}
