export default async function ({ addon, console }) {
  await addon.tab.redux.waitForState(
    (state) =>
      state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID" ||
      state.scratchGui.projectState.loadingState === "SHOWING_WITHOUT_ID"
  );

  const SA_DUPLICATE_OF = Symbol("SA_DUPLICATE_OF");

  const duplicate = addon.tab.traps.vm.runtime.targets[0].sprite.constructor.prototype.duplicate;
  addon.tab.traps.vm.runtime.targets[0].sprite.constructor.prototype.duplicate = function () {
    return duplicate.call(this).then((sprite) => {
      sprite[SA_DUPLICATE_OF] = this;
      return sprite;
    });
  };

  const addTarget = addon.tab.traps.vm.runtime.addTarget;
  addon.tab.traps.vm.runtime.addTarget = function (target) {
    addTarget.call(this, target);
    if (!addon.self.disabled && SA_DUPLICATE_OF in target.sprite) {
      addon.tab.traps.vm.reorderTarget(
        addon.tab.traps.vm.runtime.targets.length - 1,
        addon.tab.traps.vm.runtime.targets.findIndex(
          (candidate) => candidate.sprite === target.sprite[SA_DUPLICATE_OF]
        ) + 1
      );
    }
  };
}
