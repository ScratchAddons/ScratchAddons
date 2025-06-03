import Utils from "../find-bar/blockly/Utils.js";
export default async function ({ addon, msg, console }) {
  const utils = new Utils(addon);

  const Blockly = await addon.tab.traps.getBlockly();

  Object.defineProperty(Blockly.Gesture.prototype, "jumpToDef", {
    get() {
      return !addon.self.disabled;
    },
  });

  const doBlockClickMethodName = Blockly.registry ? "doBlockClick" : "doBlockClick_";
  const _doBlockClick_ = Blockly.Gesture.prototype[doBlockClickMethodName];
  Blockly.Gesture.prototype[doBlockClickMethodName] = function () {
    const event = Blockly.registry ? this.mostRecentEvent : this.mostRecentEvent_;
    if (!addon.self.disabled && (event.button === 1 || event.shiftKey)) {
      // Wheel button...
      // Intercept clicks to allow jump to...?
      let block = Blockly.registry ? this.startBlock : this.startBlock_;
      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_call") {
          let findProcCode = block.getProcCode();

          let topBlocks = addon.tab.traps.getWorkspace().getTopBlocks();
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
