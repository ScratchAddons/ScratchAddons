export default async function ({ addon }) {
  const vm = addon.tab.traps.vm;

  const oldAddSprite = vm.constructor.prototype.addSprite;
  vm.constructor.prototype.addSprite = function (input) {
    let spriteObj,
      stringify = true;
    if (typeof input === "object") [spriteObj, stringify] = [input, false];
    else spriteObj = JSON.parse(input);
    const isEmpty = spriteObj.costumes?.[0]?.baseLayerMD5 === "cd21514d0531fdffb22204e0ec5ed84a.svg";
    if (!addon.self.disabled && (isEmpty || !spriteObj.tags || !addon.settings.get("library"))) {
      if (spriteObj.scratchX) {
        spriteObj.scratchX = addon.settings.get("x");
        spriteObj.scratchY = addon.settings.get("y");
      }
      if (spriteObj.x) {
        spriteObj.x = addon.settings.get("x");
        spriteObj.y = addon.settings.get("y");
      }
    }
    return oldAddSprite.call(this, stringify ? JSON.stringify(spriteObj) : spriteObj);
  };

  const registerDupPrototype = () => {
    const targetPrototype = vm.runtime.getTargetForStage().constructor.prototype;
    const oldDuplicate = targetPrototype.duplicate;
    targetPrototype.duplicate = function () {
      return oldDuplicate.call(this).then((newSprite) => {
        if (!addon.self.disabled) {
          switch (addon.settings.get("duplicate")) {
            case "custom":
              newSprite.setXY(addon.settings.get("x"), addon.settings.get("y"));
              break;
            case "keep":
              newSprite.setXY(this.x, this.y);
          }
        }
        return newSprite;
      });
    };
  };

  if (vm.runtime.getTargetForStage()) {
    registerDupPrototype();
  } else {
    vm.runtime.once("PROJECT_LOADED", registerDupPrototype);
  }
}
