import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  enableContextMenuSeparators(addon.tab);

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
      const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex =
        makeSpaceItemIndex !== -1
          ? // If "make space" button exists, add own items before it
            makeSpaceItemIndex
          : // If there's no such button, insert at end
            items.length;

      items.splice(
        insertBeforeIndex,
        0,
        addSeparator({
          enabled: true,
          text: msg("Hide this block"),
          callback: () => {
            hideBlockById(block.id);
          },
          separator: true,
        })
      );

      return items;
    },
    { blocks: true }
  );

  async function hideBlockById(blockId) {
    const el = document.querySelector(`[data-id="${blockId}"]`);
    if (el) {
      el.remove();
    } else {
      console.warn("Failed to get object to hide by data-id: ", blockId);
    }
  }

  const workspace = document.querySelector(".blocklyBlockCanvas");

  if (workspace) {
    // Add a mutation observer to the "blockly block canvas"
    // to hide all blocks is mutation in child list occurs 
    // (Example: detects when you switch sprites which reloads the blocks)
    addMutationObserver(workspace, {childList: true}, hideBlocks)
  } else {
    console.warn("couldn't find workspace block-canvas: No element with class \"blocklyBlockCanvas\" found");
  }

  /// Adds a mutation observer to an element with a provided config and runs a function when the observer detects a mutation
  async function addMutationObserver(element, config, inputFunc) {
    // define an observer that runs a function on mutation
    const observer = new MutationObserver(inputFunc);
    // what element and mutation type to observe
    observer.observe(element, config);
  }

  async function hideBlocks() {
    console.log("function to hide blocks called");
    
  }

}
