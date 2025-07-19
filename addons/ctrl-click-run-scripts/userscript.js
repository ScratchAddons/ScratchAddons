/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;

  let ctrlKeyPressed = false;
  const onMouseDown = function (e) {
    ctrlKeyPressed = e.ctrlKey || e.metaKey;
  };
  document.addEventListener("mousedown", onMouseDown, { capture: true }); // for old Blockly
  document.addEventListener("pointerdown", onMouseDown, { capture: true }); // for new Blockly

  // Limits all script running to CTRL + click
  const newBlocklyListen = function (e) {
    if (
      !addon.self.disabled &&
      // new Blockly || old Blockly
      ((e.type === "click" && e.targetType === "block") || e.element === "stackclick") &&
      !ctrlKeyPressed
    ) {
      return;
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
