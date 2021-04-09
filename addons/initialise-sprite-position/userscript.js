export default async function ({ addon }) {
  let vm = addon.tab.traps.vm;
  let oldAddSprite = vm.addSprite;
  
  vm.addSprite = function (input) {
    let spriteObj;
    spriteObj = JSON.parse(input);
    let isEmpty = spriteObj.costumes[0].baseLayerMD5 === "cd21514d0531fdffb22204e0ec5ed84a.svg";
      
    if (isEmpty || !addon.settings.get("library")) {
      if (spriteObj.scratchX) {
        spriteObj.scratchX = parseInt(addon.settings.get("x"));
        spriteObj.scratchY = parseInt(addon.settings.get("y"));
      }
      if (spriteObj.x) {
        spriteObj.x = parseInt(addon.settings.get("x"));
        spriteObj.y = parseInt(addon.settings.get("y"));
      }
    }
    oldAddSprite.call(this, JSON.stringify(spriteObj));
  };
}
