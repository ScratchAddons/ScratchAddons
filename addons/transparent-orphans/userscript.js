export default async function ({ addon, console }) {
  // Add data-shapes attribute on new Blockly
  const Blockly = await addon.tab.traps.getBlockly();
  if (!Blockly.registry) return;

  const addShapeAttribute = (block) => {
    if (!block.outputConnection && !block.previousConnection) {
      block.svgGroup.setAttribute("data-shapes", "hat");
    }
  };
  for (const block of addon.tab.traps.getWorkspace().getAllBlocks()) {
    addShapeAttribute(block);
  }

  const oldBlockInitSvg = Blockly.BlockSvg.prototype.initSvg;
  Blockly.BlockSvg.prototype.initSvg = function (...args) {
    addShapeAttribute(this);
    return oldBlockInitSvg.call(this, ...args);
  };
}
