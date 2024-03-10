export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const _addCostume = vm.addCostume;
  vm.addCostume = (md5, costume, ...args) => {
    if (md5 === "cd21514d0531fdffb22204e0ec5ed84a.svg" && !addon.self.disabled) {
      return _addCostume.call(
        vm,
        emptyBitmap.md5,
        {
          ...emptyBitmap,
          name: costume.name,
        },
        ...args
      );
    }
    return _addCostume.call(vm, md5, costume, ...args);
  };
}

const emptyBitmap = {
  md5: "8ac8569502a1fc1a33aad0ae5786f20b.png",
  assetId: "8ac8569502a1fc1a33aad0ae5786f20b",
  bitmapResolution: 2,
  rotationCenterX: 1,
  rotationCenterY: 1,
  skinId: null,
};
