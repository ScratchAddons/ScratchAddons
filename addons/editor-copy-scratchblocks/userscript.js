import getBlockCode from "./blocks.js";

export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  addon.tab.createBlockContextMenu(
    (items) => {
      items.push({
        enabled: true,
        text: "Copy scripts as scratchblocks",
        callback: () => {
          const topBlocks = blockly.getMainWorkspace().getTopBlocks();
          console.log(topBlocks);
        },
        separator: true,
      });

      return items;
    },
    { workspace: true }
  );

  addon.tab.createBlockContextMenu(
    (items, block) => {
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
          text: "Log block scratchblocks",
          callback: () => console.log(getBlockCode(block)),
          separator: true,
        },
        {
          enabled: block.getPreviousBlock() || block.getNextBlock(),
          text: "Log script scratchblocks",
          callback: () => console.log(getBlockCode(block.getRootBlock(), true)),
        }
      );

      return items;
    },
    { blocks: true, flyout: true }
  );
}
