// This addon works by modifying the VM to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;

  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;
  var enabled = true;
  var wasJustDragged = false;
  var duplicateBehavior = false;

  // Necessary for the CTRL + click option to work
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

  const newBlocklyListen = function (e) {
    var runMode = addon.settings.get("runMode");
    // Checks if the Blockly event is a script being clicked
    if (!addon.self.disabled && e.element === "stackclick" && enabled) {
      // Completely disable all script clicking if the addon setting is enabled
      if (runMode == "fullDisable" || (runMode == "ctrl" && !ctrlKeyPressed)) {
        return;
        // Checks if the script was duplicated/pasted -- if so, disable the response (running the script) for this event
        // If CTRL + click mode is on, and the user is holding CTRL, the script running is intentional, and the check can be bypassed
      } else if (!(wasJustDragged && duplicateBehavior) || (runMode == "ctrl" && ctrlKeyPressed)) {
        originalBlocklyListen.call(this, e);
      }
      wasJustDragged = false;
      duplicateBehavior = false;
    } else {
      // Checks for the dragging event and logs it
      if (e.type === "endDrag") {
        wasJustDragged = true;
        duplicateBehavior = false;
      } else if (e.element === "selected" && e.type === "ui") {
        duplicateBehavior = true;
      } else if (e.type === "delete") {
        wasJustDragged = false;
        duplicateBehavior = false;
      }
      originalBlocklyListen.call(this, e);
    }
  };

  // Overwrite the old functions with our new ones
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;
}
