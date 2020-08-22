export default async function ({ addon, global, console }) {
  addon.tab.getScratchVM().then((vm) => {
    virtualMachine = vm;
    setInterval(() => {
      Array.prototype.forEach.call(document.querySelectorAll("path[style*='outline' i]"), (e) =>
        e.removeAttribute("style")
      );
      virtualMachine.runtime.threads.forEach((thread) => {
        thread.stack.forEach((e) => {
          try {
            var next = thread.target.blocks.getNextBlock(e);
            var blocklyBlock = Blockly.getMainWorkspace()
              .getAllBlocks()
              .find((e) => e.id === next);
            if (blocklyBlock) {
              blocklyBlock.parentBlock_.svgPath_.style.outline = "5px solid blue";
            }
          } catch {}
        });
      });
    });
  });
}
