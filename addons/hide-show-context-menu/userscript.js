export default async function ({ addon, msg }) {
  const vm = addon.tab.traps.vm;
  const getSprite = (name) => vm.runtime.targets.find((target) => target.id === name);

  const stateFromBool = (bool) => (bool ? "show" : "hide");
  const sharedOptions = {
    types: ["sprite"],
    position: "assetContextMenuAfterDelete",
    order: 9, // before folders - it's unpredictable how many slots folders takes up
    border: true,
  };

  [true, false].forEach((visibility) => {
    addon.tab.createEditorContextMenu(
      (ctx) => {
        getSprite(ctx.itemId).setVisible(visibility);
      },
      {
        ...sharedOptions,
        className: `sa-hide-show-context-menu-${stateFromBool(visibility)}`,
        label: msg(stateFromBool(visibility)),
        condition: (ctx) => getSprite(ctx.itemId).visible === !visibility,
      }
    );
  });
}
