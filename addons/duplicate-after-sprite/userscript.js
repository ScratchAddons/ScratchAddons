export default async function ({ addon, console }) {
  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });

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
      addon.tab.traps.vm.emitTargetsUpdate();
      addon.tab.traps.vm.reorderTarget(
        addon.tab.traps.vm.runtime.targets.length - 1,
        addon.tab.traps.vm.runtime.targets.findIndex(
          (candidate) => candidate.sprite === target.sprite[SA_DUPLICATE_OF]
        ) + 1
      );
    }
  };
}
