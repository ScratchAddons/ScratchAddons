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

  let doubleClick = false;
  let doubleClickTimeout;
  function startDoubleClick() {
    if (addon.settings.get("double-click")) {
      doubleClick = true;
      doubleClickTimeout = setTimeout(() => {
        doubleClick = false;
      }, 400);
    }
  }

  // Capture clicks on scripts
  const newBlocklyListen = function (e) {
    if (!addon.self.disabled && e.element === "stackclick" && !ctrlKeyPressed) {
      if (doubleClick) {
        // Allow script to execute on double click
        clearTimeout(doubleClickTimeout);
        startDoubleClick();
        originalBlocklyListen.call(this, e);
      } else {
        // Start a double-click timeout and prevent script execution
        startDoubleClick();
        return;
      }
    } else {
      originalBlocklyListen.call(this, e);
    }
  };
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
