// This is a fix for https://github.com/LLK/scratch-gui/issues/8805

export default async function ({ addon, console, msg }) {
  const { storage } = addon.tab.traps.vm.runtime;

  const oldAddStore = storage.webHelper.addStore;
  storage.webHelper.addStore = function (...args) {
    if (storage.webHelper.stores.length === 1 && storage._hasAddedBackpackSource) {
      // Backpack store has been added too early!
      // It's now the first store in the array, which causes the bug we're trying to fix.
      const backpackStore = storage.webHelper.stores[0];

      // Wait until the 3 "official" stores are added.
      // https://github.com/LLK/scratch-gui/blob/4564cf6be66d16712ae252a807f600c412dddf99/src/lib/storage.js#L14
      queueMicrotask(() => {
        // Move backpack store to end of array.
        this.stores.splice(0, 1);
        this.stores.push(backpackStore);
      });
    }
    return oldAddStore.call(this, ...args);
  };
}
