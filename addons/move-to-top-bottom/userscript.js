export default async ({ addon, console, msg }) => {
  const types = ["sound"];

  // Costumes should not be affected if user is running DevtoolsExtension before version 1.20.0
  const extVersion = window.devtoolsExtensionVersion || "1.17.1"; // 1.17.1 (or lower)
  const [major, minor, _] = extVersion.split(".");
  if (window.initGUI && major === "1" && Number(minor) < 20) {
    console.log("Devtools extension already adds send to top/bottom buttons to costumes");
  } else {
    types.push("costume");
  }

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
