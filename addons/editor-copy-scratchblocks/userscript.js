// From https://github.com/apple502j/parse-sb3-blocks/releases/tag/v0.5.2
import { toScratchblocks } from "../../libraries/thirdparty/cs/parse-sb3-blocks.module.js";

// Some code referenced from blocks2image, block-switching and editor-devtools
export default async function ({ addon, console, msg }) {
  // Add right-click "Copy scratchblocks code" button to blocks
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
      // "Copy scratchblocks code" message in /addons-l10n/en/editor-copy-scratchblocks.json (translate this)
      items.splice(insertBeforeIndex, 0, {
        enabled: true,
        text: msg("copy-scratchblocks"),
        callback: () => {
          convertToScratchblocks(block);
        },
        separator: true,
      });
      return items;
    },
    { blocks: true }
  );

  async function convertToScratchblocks(block) {
    // const blockId = block.getRootBlock().id; // Start from the topmost block, parsing the entire stack
    let blockId = block.id;

    // Get blocks in current sprite as project.json format
    const vm = addon.tab.traps.vm;
    let blocksJSON = JSON.parse(vm.toJSON(vm.editingTarget.id)).blocks;
    let language = addon.settings.get("forceEnglish") ? "en" : addon.auth.scratchLang;

    // Send ID and current blocks to parse-sb3-blocks, set indent spacing and fix variables that have the same name as reporters.
    // Only outputs English blocks, TODO: Detect editor language and pass it to third input for multilingual scratchblocks.
    let scratchblocks = toScratchblocks(blockId, blocksJSON, language, {
      tabs: " ".repeat(4),
      variableStyle: "as-needed",
    });

    let codeTags = addon.settings.get("codeTags");
    // Add square or angled code tags around scratchblocks for Forums and Wiki formatting
    if (codeTags == "square") {
      scratchblocks = "[scratchblocks]\n" + scratchblocks + "\n[/scratchblocks]";
    } else if (codeTags == "angled") {
      scratchblocks = "<scratchblocks>\n" + scratchblocks + "\n</scratchblocks>";
    }

    console.log(scratchblocks);
    navigator.clipboard.writeText(scratchblocks);
  }
}
