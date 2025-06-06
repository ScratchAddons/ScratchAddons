export default async ({ addon, console, msg }) => {
  const types = ["costume", "sound"];

  addon.tab.createEditorContextMenu(
    (ctx) => {
      const target = addon.tab.traps.vm.editingTarget;
      if (ctx.type === "sound") {
        target.reorderSound(ctx.index, 0);
      } else {
        target.reorderCostume(ctx.index, 0);
      }
      queueMicrotask(() => {
        addon.tab.traps.vm.emitTargetsUpdate();
        addon.tab.traps.vm.runtime.emitProjectChanged();
        ctx.target.click();
      });
    },
    {
      types,
      position: "assetContextMenuAfterExport",
      order: 1,
      label: msg("top"),
      condition: (ctx) => ctx.index !== 0,
    }
  );
  addon.tab.createEditorContextMenu(
    (ctx) => {
      const target = addon.tab.traps.vm.editingTarget;
      if (ctx.type === "sound") {
        target.reorderSound(ctx.index, Infinity);
      } else {
        target.reorderCostume(ctx.index, Infinity);
      }
      queueMicrotask(() => {
        addon.tab.traps.vm.emitTargetsUpdate();
        addon.tab.traps.vm.runtime.emitProjectChanged();
        ctx.target.click();
      });
    },
    {
      types,
      position: "assetContextMenuAfterExport",
      order: 2,
      label: msg("bottom"),
      condition: (ctx) => ctx.index !== ctx.target.parentNode.parentNode.childElementCount - 1,
    }
  );
};
