import { getBlockCode, getScriptsCode } from "./blocks.js";

export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  addon.tab.createBlockContextMenu(
    (items) => {
      if (addon.self.disabled) return items;

      items.push({
        enabled: true,
        text: "Copy scripts as scratchblocks",
        callback: () => {
          const topBlocks = blockly.getMainWorkspace().getTopBlocks();
          console.log(getScriptsCode(...topBlocks));
        },
        separator: true,
      });

      return items;
    },
    { workspace: true }
  );

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;

      items.push(
        {
          enabled: true,
          text: "Log block",
          callback: () => {
            console.log(block);
          },
          separator: true,
        },
        {
          enabled: true,
          text: "Log input names",
          callback: () => {
            console.log(block.inputList.map((input) => input.name));
          },
        },
        {
          enabled: true,
          text: "Log block code",
          callback: () => console.log(block.type),
        },
        {
          enabled: true,
          text: "Copy block as scratchblocks code",
          callback: () => console.log(getBlockCode(block)),
          separator: true,
        }
      );

      if (block.getRootBlock()?.getNextBlock()) {
        items.push({
          enabled: true,
          text: "Copy script as scratchblocks code",
          callback: () => console.log(getScriptsCode(block.getRootBlock())),
        });
      }

      return items;
    },
    { blocks: true, flyout: true }
  );
}
