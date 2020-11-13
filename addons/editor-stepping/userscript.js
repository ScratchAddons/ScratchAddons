export default async function ({ addon, global, console }) {
  const virtualMachine = addon.tab.traps.onceValues.vm;

  let removeInterval = () => {};
  if (addon.tab.editorMode === "editor") {
    removeInterval = addInterval();
  }

  addon.tab.addEventListener("urlChange", () => {
    if (addon.tab.editorMode === "editor") {
      removeInterval();
      addInterval();
    } else removeInterval();
  });

  function addInterval() {
    const interval = setInterval(() => {
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
    }, 500);
    return () => clearInterval(interval);
  }
}
