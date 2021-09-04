export default async ({ addon, console, msg }) => {
  addon.tab.createEditorContextMenu(
    (ctx) => {
      const target = addon.tab.traps.vm.editingTarget;
      if (ctx.type === "sound") {
        target.reorderSound(ctx.index, 0);
      } else {
        target.reorderCostume(ctx.index, 0);
      }
      queueMicrotask(() => ctx.target.click());
    },
    {
      types: ["sound", "costume"],
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
      queueMicrotask(() => ctx.target.click());
    },
    {
      types: ["sound", "costume"],
      position: "assetContextMenuAfterExport",
      order: 2,
      label: msg("bottom"),
      condition: (ctx) => ctx.index !== ctx.target.parentNode.parentNode.childElementCount - 1,
    }
  );
};
