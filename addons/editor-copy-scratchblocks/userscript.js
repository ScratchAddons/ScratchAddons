import { getBlockCode, getScriptsCode } from "./blocks.js";

export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  addon.tab.createBlockContextMenu(
    (items) => {
      if (addon.self.disabled) return items;

      const topBlocks = blockly.getMainWorkspace().getTopBlocks();
      if (topBlocks.length > 0) {
        items.push({
          enabled: true,
          text: "Copy scripts as scratchblocks",
          callback: () => navigator.clipboard.writeText(getScriptsCode(...topBlocks)),
          separator: true,
        });
      }

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
          text: "Get dropdown info",
          callback: () => {
            const dropdown = block.getChildren()[parseInt(prompt("Child number", "0"))];
            console.log(dropdown.type, dropdown.inputList[0].fieldRow[0].name);
          },
        },
        {
          enabled: true,
          text: "Copy block as scratchblocks code",
          callback: () => navigator.clipboard.writeText(getBlockCode(block)),
          separator: true,
        }
      );

      if (block.getRootBlock()?.getNextBlock()) {
        items.push({
          enabled: true,
          text: "Copy script as scratchblocks code",
          callback: () => navigator.clipboard.writeText(getScriptsCode(block.getRootBlock())),
        });
      }

      return items;
    },
    { blocks: true, flyout: true }
  );
}
