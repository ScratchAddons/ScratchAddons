import { getBlockCode, getScriptsCode } from "./blocks.js";

export default async ({ addon, msg }) => {
  addon.tab.createBlockContextMenu(
    (items) => {
      if (addon.self.disabled) return items;

      const topBlocks = addon.tab.traps.getWorkspace().getTopBlocks();
      if (topBlocks.length > 0) {
        items.push({
          enabled: true,
          text: msg("copy-all-scripts-code"),
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

      items.push({
        enabled: true,
        text: msg("copy-block-code"),
        callback: () => navigator.clipboard.writeText(getBlockCode(block)),
        separator: true,
      });

      if (block.getRootBlock()?.getNextBlock()) {
        items.push({
          enabled: true,
          text: msg("copy-script-code"),
          callback: () => navigator.clipboard.writeText(getScriptsCode(block.getRootBlock())),
        });
      }

      return items;
    },
    { blocks: true, flyout: true }
  );
};
