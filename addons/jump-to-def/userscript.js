import Utils from "../find-bar/blockly/Utils.js";
export default async function ({ addon, msg, console }) {
  const utils = new Utils(addon);

  const Blockly = await addon.tab.traps.getBlockly();

  function jumpToBlockDefinition(block) {
    let findProcCode = block.getProcCode();

    let topBlocks = addon.tab.traps.getWorkspace().getTopBlocks();
    for (const root of topBlocks) {
      if (root.type === "procedures_definition") {
        let label = root.getChildren()[0];
        let procCode = label.getProcCode();
        if (procCode && procCode === findProcCode) {
          // Found... navigate to it!
          utils.scrollBlockIntoView(root);
        }
      }
    }
  }

  Object.defineProperty(Blockly.Gesture.prototype, "jumpToDef", {
    get() {
      return !addon.self.disabled;
    },
  });

  const _doBlockClick = Blockly.Gesture.prototype.doBlockClick;
  Blockly.Gesture.prototype.doBlockClick = function () {
    const event = this.mostRecentEvent;
    if (!addon.self.disabled && (event.button === 1 || event.shiftKey)) {
      // Wheel button...
      // Intercept clicks to allow jump to...?
      let block = this.startBlock;
      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_call") {
          jumpToBlockDefinition(block);
          return;
        }
      }
    }

    _doBlockClick.call(this);
  };

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (!addon.self.disabled && block.type === "procedures_call") {
        items.push({
          enabled: true,
          text: msg("to-def"),
          callback: () => jumpToBlockDefinition(block),
        });
      }
      return items;
    },
    { blocks: true, flyout: true }
  );
}
