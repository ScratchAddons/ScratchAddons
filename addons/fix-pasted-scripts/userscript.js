// This addon works by modifying the VM to not react to clicking scripts.

export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;

  const originalBlocklyListen = vm.editingTarget.blocks.constructor.prototype.blocklyListen;
  var enabled = true;
  var fullDisable = addon.settings.get("fullDisable");
  var wasJustDragged = false;
  var duplicateBehavior = false;

  const newBlocklyListen = function (e) {
    // Checks if the Blockly event is a script being clicked
    if (e.element === "stackclick" && enabled) {
      // Completely disable all script clicking if the addon setting is enabled
      if (fullDisable) {
        return;
        // Checks if the script was duplicated/pasted -- if so, disable the response (running the script) for this event
      } else if (!(wasJustDragged && duplicateBehavior)) {
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
      }
      originalBlocklyListen.call(this, e);
    }
  };

  // Overwrite the old functions with our new ones
  vm.editingTarget.blocks.constructor.prototype.blocklyListen = newBlocklyListen;

  // When the setting is toggled, update the variable that contains it
  addon.settings.addEventListener("change", function () {
    fullDisable = addon.settings.get("fullDisable");
  });
}
