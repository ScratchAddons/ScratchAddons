export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;

  let singleClickRequired,
    doubleClickRequired,
    ctrlClickRequired = false;
  let multiClickTime;
  function updateSettings() {
    singleClickRequired = addon.settings.get("run-action") === "single";
    doubleClickRequired = addon.settings.get("run-action") === "double";
    ctrlClickRequired = addon.settings.get("run-action") === "ctrl";
    multiClickTime = addon.settings.get("timeout");
  }
  addon.settings.addEventListener("change", updateSettings);
  updateSettings();

  let multiClickTimeout;
  let consecutiveClicks = 0;
  let ctrlKeyPressed = false;
  const onMouseDown = function (e) {
    // Check if either Ctrl or Cmd are pressed during a click
    ctrlKeyPressed = e.ctrlKey || e.metaKey;
    // Start a multi-click
    consecutiveClicks += 1;
    clearTimeout(multiClickTimeout);
    multiClickTimeout = setTimeout(() => {
      consecutiveClicks = 0;
    }, multiClickTime);
  };
  document.addEventListener("pointerdown", onMouseDown, { capture: true });

  function canExecuteScript() {
    if (singleClickRequired) {
      // Ignore double clicks
      return consecutiveClicks !== 2;
    } else if (doubleClickRequired) {
      // Ignore single clicks
      return consecutiveClicks >= 2;
    } else if (ctrlClickRequired) {
      // Only respond to clicks while holding Ctrl or Cmd
      return ctrlKeyPressed;
    } else {
      // ...Huh?
      console.warn("Required action not specified.");
      return true;
    }
  }

  // Capture clicks on scripts
  const newBlocklyListen = function (e) {
    if (
      !addon.self.disabled &&
      // new Blockly || old Blockly
      ((e.type === "click" && e.targetType === "block") || e.element === "stackclick") &&
      !canExecuteScript()
    ) {
      // Ignore
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
