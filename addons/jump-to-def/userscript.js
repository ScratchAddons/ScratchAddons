import Utils from "../find-bar/blockly/Utils.js";
export default async function ({ addon, msg, console }) {
  if (!addon.self._isDevtoolsExtension && window.initGUI) {
    console.log("Extension running, stopping addon");
    window._devtoolsAddonEnabled = true;
    window.dispatchEvent(new CustomEvent("scratchAddonsDevtoolsAddonStopped"));
    return;
  }

  const utils = new Utils(addon);

  const Blockly = await addon.tab.traps.getBlockly();

  Object.defineProperty(Blockly.Gesture.prototype, "jumpToDef", {
    get() {
      return !addon.self.disabled;
    },
  });

  const _doBlockClick_ = Blockly.Gesture.prototype.doBlockClick_;
  Blockly.Gesture.prototype.doBlockClick_ = function () {
    if (!addon.self.disabled && (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey)) {
      // Wheel button...
      // Intercept clicks to allow jump to...?
      let block = this.startBlock_;
      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_call") {
          let findProcCode = block.getProcCode();

          let topBlocks = utils.getWorkspace().getTopBlocks();
          for (const root of topBlocks) {
            if (root.type === "procedures_definition") {
              let label = root.getChildren()[0];
              let procCode = label.getProcCode();
              if (procCode && procCode === findProcCode) {
                // Found... navigate to it!
                utils.scrollBlockIntoView(root);
                return;
              }
            }
          }
        }
      }
    }

    _doBlockClick_.call(this);
  };
}
