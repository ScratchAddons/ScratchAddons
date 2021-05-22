export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;

  // Necessary to detect the CTRL/CMD key
  var ctrlKeyPressed = false;
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey) {
      ctrlKeyPressed = true;
    }
  });
  document.addEventListener("keyup", function (e) {
    if (!e.ctrlKey) {
      ctrlKeyPressed = false;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey) {
      ctrlKeyPressed = true;
    }
  });
  document.addEventListener("keyup", function (e) {
    if (!e.metaKey) {
      ctrlKeyPressed = false;
    }
  });

  // Limits all script running to CTRL + click
  const newBlocklyListen = function (e) {
    if (!addon.self.disabled && e.element === "stackclick" && !ctrlKeyPressed) {
      return;
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
