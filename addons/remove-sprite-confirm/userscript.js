export default async ({ addon, console }) => {
  if (!addon.tab.redux.state) return console.warn("Redux is not available!");
  const vm = addon.tab.traps.onceValues.vm;
  if (!vm) return;
  const oldDeleteSprite = vm.deleteSprite;
  vm.deleteSprite = function (...args) {
    const canDelete = confirm("Do you want to delete the sprite?");
    if (canDelete) return oldDeleteSprite.apply(this, args);
    const restoreDeletionState = Object.assign({}, addon.tab.redux.state.scratchGui.restoreDeletion);
    setTimeout(
      () =>
        addon.tab.redux.dispatch({
          type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
          state: restoreDeletionState,
        }),
      100
    );
    return Promise.resolve();
  };
};
