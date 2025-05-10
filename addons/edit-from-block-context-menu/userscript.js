/**
 * @import UserscriptAddon from "../../addon-api/content-script/Addon";
 * @param {{ addon: UserscriptAddon }} options
 */
export default async function ({ addon, msg }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (!addon.self.disabled && block.type.startsWith("data_")) {
        const variable = block.workspace.getVariableById(block.getVars()[0]);
        if (variable) {
          items.push({
            enabled: true,
            separator: false,
            text: msg("edit"),
            callback: ScratchBlocks.Constants.Data.RENAME_OPTION_CALLBACK_FACTORY(
              block,
              block.getCategory() === "data" ? "VARIABLE" : "LIST"
            ),
          });
        }
      }
      return items;
    },
    {
      blocks: true,
    }
  );
}
