// Initial code was written by Norbiros

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  function spriteToFront(name) {
    const target = vm.runtime.getSpriteTargetByName(name);
    target.goToFront();
    target.setVisible(true);
  }

  document.body.addEventListener("click", (e) => {
    if (e.shiftKey && !addon.self.disabled) {
      const parentDiv = e.target.closest("div[class^='sprite-selector_sprite-wrapper']");
      if (parentDiv) {
        if (
          e.target.closest("div[class^='delete-button_delete-button_']") ||
          e.target.closest(".sa-sprite-properties-info-btn")
        )
          return;
        const spriteName = parentDiv.querySelector("div[class^='sprite-selector-item_sprite-name']").innerText;
        spriteToFront(spriteName);
      }
    }
  });
  addon.tab.createEditorContextMenu(
    (ctx) => {
      spriteToFront(ctx.name);
    },
    {
      types: ["sprite"],
      position: "assetContextMenuAfterExport",
      order: 1,
      label: msg("move-to-front-layer"),
    }
  );
}
