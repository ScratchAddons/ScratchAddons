export default async function ({ addon, msg }) {
  const vm = addon.tab.traps.vm;
  const getSprite = (name) => {
    return vm.runtime.targets.find((target) => target.sprite.name === name);
  };
  const stateFromBool = (bool) => (bool ? "show" : "hide");
  const sharedOptions = {
    types: ["sprite"],
    position: "assetContextMenuAfterDelete",
    order: 12, // after folders
    border: true,
  };
  window.vm = vm;

  [true, false].forEach((visibility) => {
    addon.tab.createEditorContextMenu(
      (ctx) => {
        getSprite(ctx.name).setVisible(visibility);
      },
      {
        ...sharedOptions,
        className: `sa-hide-show-context-menu-${stateFromBool(visibility)}`,
        label: msg(stateFromBool(visibility)),
        condition: (ctx) => getSprite(ctx.name).visible === !visibility,
      }
    );
  });
}
