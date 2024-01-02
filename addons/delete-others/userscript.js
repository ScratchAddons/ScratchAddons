export default async function ({ addon, console, msg }) {
  const vm = await addon.tab.traps.vm;

  const types = ["sound", "costume"];
  let deletedItems = [];
  let deleted;
  let target;

  function getRestoreCostumeFun() {
    deletedItems.forEach((costume) => {
      vm.addCostume(costume.md5, costume, target.id, "");
    });
    deletedItems = [];
  }

  function getRestoreSoundFun() {
    deletedItems.forEach((sound) => {
      vm.addSound(sound, target.id);
    });
    deletedItems = [];
  }

  addon.tab.createEditorContextMenu(
    (ctx) => {
      const type = ctx.type === "costume" ? "Costume" : "Sound";

      deletedItems = [];
      target = vm.editingTarget;
      const deleteBefore = ctx.index;

      if (ctx.type === "costume") {
        for (let i = 0; i < deleteBefore; i++) {
          deleted = target.deleteCostume(0);
          if (deleted) deletedItems.push(deleted);
        }
        while (true) {
          deleted = target.deleteCostume(target.getCostumes().length - 1);
          if (deleted) deletedItems.push(deleted);
          else break;
        }
      } else {
        for (let i = 0; i < deleteBefore; i++) {
          deleted = target.deleteSound(0);
          if (deleted) deletedItems.push(deleted);
        }
        while (true) {
          if (target.getSounds().length > 1) deleted = target.deleteSound(target.getSounds().length - 1);
          else break;
          if (deleted) deletedItems.push(deleted);
          else break;
        }
      }

      addon.tab.redux.dispatch({
        type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
        state: { restoreFun: ctx.type === "costume" ? getRestoreCostumeFun : getRestoreSoundFun, deletedItem: type },
      });
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
