export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  const types = ["sound", "costume"];
  let deletedItems = [];
  let deleted;
  let target;

  function getRestoreFun(type) {
    deletedItems.reverse();
    if (type === "costume") {
      deletedItems.forEach((costume) => {
        vm.addCostume(costume.md5, costume, target.id, "");
      });
    } else if (type === "sound") {
      deletedItems.forEach((sound) => {
        target.addSound(sound);
      });
    }
    vm.emitTargetsUpdate();
    deletedItems = [];
  }

  addon.tab.createEditorContextMenu(
    async (ctx) => {
      if (
        await addon.tab.confirm(msg("confirmTitle"), msg(ctx.type === "costume" ? "infoCostume" : "infoSound"), {
          useEditorClasses: true,
        })
      ) {
        const type = ctx.type === "costume" ? "Costume" : "Sound";

        deletedItems = [];
        target = vm.editingTarget;

        const numberOfAssets = ctx.type === "costume" ? target.getCostumes().length : target.getSounds().length;

        for (let i = numberOfAssets - 1; i > -1; i--) {
          if (i !== ctx.index) {
            deleted = ctx.type === "costume" ? target.deleteCostume(i) : target.deleteSound(i);
            if (deleted) deletedItems.push(deleted);
          }
        }

        addon.tab.redux.dispatch({
          type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
          state: {
            restoreFun: getRestoreFun.bind(this, ctx.type),
            deletedItem: `${type}${deletedItems.length > 1 ? "s" : ""}`,
          },
        });
      }
    },
    {
      types,
      position: "assetContextMenuAfterDelete",
      order: 1,
      label: msg("deleteOthers"),
      dangerous: true,
      condition: showDeleteOthers,
    }
  );

  function showDeleteOthers(ctx) {
    if (addon.self.disabled) return false;
    if (ctx.type === "costume") {
      return vm.editingTarget.getCostumes().length > 1;
    } else {
      return vm.editingTarget.getSounds().length > 1;
    }
  }

  while (true) {
    const restoreButton = await addon.tab.waitForElement(
      '[class*="menu-bar_menu-bar-item_"]:nth-child(4) [class*="menu_menu-item_"]:first-child > span',
      { markAsSeen: true, reduxCondition: (state) => state.scratchGui.menus.editMenu }
    );

    const deletedItem = addon.tab.redux.state.scratchGui.restoreDeletion.deletedItem;

    if (deletedItem && deletedItem.endsWith("s")) restoreButton.innerText = msg(`multi${deletedItem}`);
  }
}
