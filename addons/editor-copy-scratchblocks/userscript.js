// From https://github.com/apple502j/parse-sb3-blocks/releases/tag/v0.5.2
import { toScratchblocks } from "./parse-sb3-blocks.module.js";

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
    let blocksJSON = vm.editingTarget.blocks._blocks;

    // Example input for debugging, copied from the "blocks" section from project.json inside an unzipped .sb3 project.
    //blockId = "1{LvJ7kk+%gYl9d!/SPx";
    //blocksJSON = {"1{LvJ7kk+%gYl9d!/SPx":{"opcode":"control_if_else","next":null,"parent":null,"inputs":{"SUBSTACK":[2,"mUCk{7U4U?e9(j937,Ae"]},"fields":{},"shadow":false,"topLevel":true,"x":248,"y":246},"mUCk{7U4U?e9(j937,Ae":{"opcode":"looks_switchcostumeto","next":null,"parent":"1{LvJ7kk+%gYl9d!/SPx","inputs":{"COSTUME":[1,"x|K5dD_P^}(xpD~A$5pb"]},"fields":{},"shadow":false,"topLevel":false},"x|K5dD_P^}(xpD~A$5pb":{"opcode":"looks_costume","next":null,"parent":"mUCk{7U4U?e9(j937,Ae","inputs":{},"fields":{"COSTUME":["costume2",null]},"shadow":true,"topLevel":false}}
    // Here are the same blocks as above, copied from vm.editingTarget.blocks inside the project editor. The JSON is formatted a bit different such as "SUBSTACK" not being an array, and causes issues when parsing some types of blocks.
    //blocksJSON = {"1{LvJ7kk+%gYl9d!/SPx":{"id":"1{LvJ7kk+%gYl9d!/SPx","opcode":"control_if_else","inputs":{"SUBSTACK":{"name":"SUBSTACK","block":"mUCk{7U4U?e9(j937,Ae","shadow":null}},"fields":{},"next":null,"topLevel":true,"parent":null,"shadow":false,"x":247.5555555555555,"y":245.7777777777769},"mUCk{7U4U?e9(j937,Ae":{"id":"mUCk{7U4U?e9(j937,Ae","opcode":"looks_switchcostumeto","inputs":{"COSTUME":{"name":"COSTUME","block":"x|K5dD_P^}(xpD~A$5pb","shadow":"x|K5dD_P^}(xpD~A$5pb"}},"fields":{},"next":null,"topLevel":false,"parent":"1{LvJ7kk+%gYl9d!/SPx","shadow":false,"x":"-358","y":"224"},"x|K5dD_P^}(xpD~A$5pb":{"id":"x|K5dD_P^}(xpD~A$5pb","opcode":"looks_costume","inputs":{},"fields":{"COSTUME":{"name":"COSTUME","value":"costume2"}},"next":null,"topLevel":false,"parent":"mUCk{7U4U?e9(j937,Ae","shadow":true}}

    console.log(blockId);
    console.log(JSON.stringify(blocksJSON));

    // Send ID and current blocks to parse-sb3-blocks, set indent spacing and fix variables that have the same name as reporters.
    // Only outputs English blocks, TODO: Detect editor language and pass it to third input for multilingual scratchblocks.
    const scratchblocks = toScratchblocks(blockId, blocksJSON, "en", {
      tabs: " ".repeat(4),
      variableStyle: "as-needed",
    });

    console.log(scratchblocks);
    navigator.clipboard.writeText(scratchblocks);
  }
}
