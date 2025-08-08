import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  // Get list of hidden blocks from local storage
  const hiddenBlockIds = new Set(getHiddenBlockIds());

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
          text: msg("hideThisBlock"),
          callback: () => {
            hiddenBlockIds.add(block.id);
            saveHiddenBlockIds(hiddenBlockIds);
            hideBlockById(block.id);
          },
          separator: true,
        })
      );

      return items;
    },
    { blocks: true }
  );

  console.log("Hidden block ids", hiddenBlockIds);

  /* =================================================================================== */

  const workspace = document.querySelector(".blocklyBlockCanvas");

  if (workspace) {
    // Add a mutation observer to the "blockly block canvas"
    // to hide "all" blocks if mutation in child list occurs
    // (Example: detects when you switch sprites which reloads the blocks)
    addMutationObserver(workspace, { childList: true }, hideBlocks);
  } else {
    console.warn('couldn\'t find workspace block-canvas: No element with class "blocklyBlockCanvas" found');
  }

  async function hideBlockById(blockId) {
    const blockDOM = document.querySelector(`[data-id="${blockId}"]`);
    if (blockDOM) {
      const blockPlaceholder = document.createElement("div");
      console.log(blockPlaceholder);
      // blockPlaceholder.style.width = "200px";
      // blockPlaceholder.style.height = "100px";
      // blockPlaceholder.style.backgroundColor = "red";
      // blockPlaceholder.setAttribute("transform", blockDOM.getAttribute("transform"));
      // blockPlaceholder.classList.add("blocklyDraggable");
      // blockPlaceholder.innerHTML = "text";
      blockDOM.parentElement.appendChild(blockPlaceholder);
      blockDOM.remove();
    } else {
      console.warn("Failed to get blockDOM to hide by data-id: ", blockId);
    }
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
    hiddenBlockIds.forEach((id) => {
      // if a block with an id from the list is found then we hide it
      if (document.querySelector(`[data-id="${id}"]`)) {
        hideBlockById(id);
      }
    });
  }

  function getHiddenBlockIds() {
    return JSON.parse(localStorage.getItem("hiddenBlockIds") || "[]");
  }

  function saveHiddenBlockIds(ids) {
    localStorage.setItem("hiddenBlockIds", JSON.stringify(Array.from(ids)));
  }
}
