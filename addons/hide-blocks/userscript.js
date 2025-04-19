import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  enableContextMenuSeparators(addon.tab);

  //   if (Blockly.registry) {
  //     // new Blockly
  //     Blockly.ContextMenuRegistry.registry.register(
  //       addSeparator({
  //         displayText: msg("saveAll"),
  //         preconditionFn: () => {
  //           if (addon.self.disabled) return "hidden";
  //           if (document.querySelector("svg.blocklySvg g.blocklyBlockCanvas > g.blocklyBlock")) return "enabled";
  //           return "disabled";
  //         },
  //         callback: () => {
  //           exportPopup();
  //         },
  //         scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
  //         id: "saSaveAllAsImage",
  //         weight: 9, // after Add Comment
  //       })
  //     );
  //   } else {
  //     addon.tab.createBlockContextMenu(
  //       (items) => {
  //         if (addon.self.disabled) return items;
  //         let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");

  //         const pasteItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
  //         const insertBeforeIndex =
  //           pasteItemIndex !== -1
  //             ? // If "paste" button exists, add own items before it
  //               pasteItemIndex
  //             : // If there's no such button, insert at end
  //               items.length;

  //         items.splice(insertBeforeIndex, 0, {
  //           enabled: !!svgchild?.childNodes?.length,
  //           text: msg("saveAll"),
  //           callback: () => {
  //             exportPopup();
  //           },
  //           separator: true,
  //         });

  //         return items;
  //       },
  //       { workspace: true }
  //     );
  //   }

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
            hideBlock(block);
          },
          separator: true,
        })
      );

      return items;
    },
    { blocks: true }
  );

  async function hideBlock(block) {
    console.log("clicked hide block button", block.id);
    console.log("fetching DOM object by id");

    const i = block.id;
    const el = document.querySelector(`[data-id="${i}"]`);
    if (el) {
      el.remove();
    } else {
      console.log("failed to get object by id: ", block.id);
    }
  }
}
