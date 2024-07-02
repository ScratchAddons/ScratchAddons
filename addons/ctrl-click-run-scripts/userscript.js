export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;

  let ctrlKeyPressed = false;
  document.addEventListener(
    "mousedown",
    function (e) {
      ctrlKeyPressed = e.ctrlKey || e.metaKey;
    },
    {
      capture: true,
    }
  );

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
