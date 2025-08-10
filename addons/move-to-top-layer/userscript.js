// Initial code was written by Norbiros

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  function spriteToFront(id) {
    const target = vm.runtime.getTargetById(id);
    target.goToFront();
    target.setVisible(true);
  }

  document.body.addEventListener("click", (e) => {
    if (e.shiftKey && !addon.self.disabled) {
      const parentDiv = e.target.closest("div[class^='sprite-selector_sprite-wrapper']");
      if (
        parentDiv &&
        !e.target.closest("div[class^='delete-button_delete-button_']") &&
        !e.target.closest(".sa-sprite-properties-info-btn")
      ) {
        const reactInternalKey = addon.tab.traps.getInternalKey(parentDiv);
        const spriteId = parentDiv[reactInternalKey].child.key;
        if (!spriteId.startsWith("&__")) {
          // Not a folder
          spriteToFront(spriteId);
        }
      }
    }
  });
  addon.tab.createEditorContextMenu(
    (ctx) => {
      console.log(ctx);
      spriteToFront(ctx.itemId);
    },
    {
      types: ["sprite"],
      position: "assetContextMenuAfterExport",
      order: 1,
      label: msg("move-to-front-layer"),
      condition: (ctx) => typeof ctx.itemId === "string",
    }
  );
}
