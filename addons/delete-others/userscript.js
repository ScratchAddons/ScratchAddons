export default async function ({ addon, console, msg }) {
  const vm = await addon.tab.traps.vm;

  const types = ["sound", "costume"];
  let deletedItems = [];
  let deleted;
  let target;

  function getRestoreFun(type) {
    if (type === "costume") {
      deletedItems.forEach((costume) => {
        vm.addCostume(costume.md5, costume, target.id, "");
      });
    } else if (type === "sound") {
      deletedItems.forEach((sound) => {
        vm.addSound(sound, target.id);
      });
    }
    deletedItems = [];
  }

  addon.tab.createEditorContextMenu(
    async (ctx) => {
      if (
        await addon.tab.confirm(
          msg(ctx.type === "costume" ? "confirmCostume" : "confirmSound"),
          msg(ctx.type === "costume" ? "infoCostume" : "infoSound")
        )
      ) {
        const type = ctx.type === "costume" ? "Costume" : "Sound";

        deletedItems = [];
        target = vm.editingTarget;

        const loop = ctx.type === "costume" ? target.getCostumes().length - 1 : target.getSounds().length - 1;

        for (let i = loop; i > -1; i--) {
          if (i !== ctx.index) {
            deleted = ctx.type === "costume" ? target.deleteCostume(i) : target.deleteSound(i);
            if (deleted) deletedItems.push(deleted);
          }
        }

        addon.tab.redux.dispatch({
          type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
          state: {
            restoreFun: getRestoreFun.bind(this, ctx.type),
            deletedItem: type,
          },
        });
      }
    },
    {
      types,
      position: "assetContextMenuAfterDelete",
      order: 1,
      label: msg("deleteOthers"),
      condition: showDeleteOthers,
    }
  );

  function showDeleteOthers(ctx) {
    if (ctx.type === "costume") {
      return vm.editingTarget.getCostumes().length > 1;
    } else {
      return vm.editingTarget.getSounds().length > 1;
    }
  }
}
