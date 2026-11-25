export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  let lastClickTime = -Infinity;
  let preventScriptRun;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const isCtrlClick = e.ctrlKey || e.metaKey;
      const isDoubleClick = e.timeStamp - lastClickTime < addon.settings.get("timeout");
      lastClickTime = e.timeStamp;

      preventScriptRun = !isCtrlClick && !isDoubleClick;
    },
    { capture: true }
  );

  // Capture clicks on scripts
  const oldBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;
  const newBlocklyListen = function (e) {
    if (
      !addon.self.disabled &&
      // new Blockly || old Blockly
      ((e.type === "click" && e.targetType === "block") || e.element === "stackclick") &&
      preventScriptRun
    ) {
      // Ignore
    } else {
      oldBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
