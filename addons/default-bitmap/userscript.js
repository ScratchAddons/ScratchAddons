export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  const EMPTY_BITMAP = {
    md5: "8ac8569502a1fc1a33aad0ae5786f20b.png",
    assetId: "8ac8569502a1fc1a33aad0ae5786f20b",
    bitmapResolution: 2,
    rotationCenterX: 1,
    rotationCenterY: 1,
    skinId: null,
  };

  const originalAddCostume = vm.addCostume;
  vm.addCostume = function (md5, costume, ...args) {
    if (md5 === "cd21514d0531fdffb22204e0ec5ed84a.svg" && !addon.self.disabled) {
      const newCostumeArg = {
        ...EMPTY_BITMAP,
        name: costume.name,
      };
      return originalAddCostume.call(this, EMPTY_BITMAP.md5, newCostumeArg, ...args);
    }
    return originalAddCostume.call(this, md5, costume, ...args);
  };
}
