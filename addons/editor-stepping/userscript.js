export default async function ({ addon, global, console }) {
  const virtualMachine = addon.tab.traps.vm;

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

  document.body.insertAdjacentHTML(
    "beforeend",
    `
<svg>
  <filter id="blueStackGlow" height="160%" width="180%" y="-30%" x="-40%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4">
    </feGaussianBlur>

    <feComponentTransfer result="outBlur">
      <feFuncA type="table" tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1">
      </feFuncA>
    </feComponentTransfer>

    <feFlood flood-color="blue" flood-opacity="1" result="outColor">
    </feFlood>

    <feComposite in="outColor" in2="outBlur" operator="in" result="outGlow">
    </feComposite>
    
    <feComposite in="SourceGraphic" in2="outGlow" operator="over">
    </feComposite>
  </filter>
</svg>
`
  );

  function addInterval() {
    const interval = setInterval(() => {
      Array.prototype.forEach.call(document.querySelectorAll("path[style*='filter' i]"), (e) => (e.style.filter = ""));
      virtualMachine.runtime.threads.forEach((thread) => {
        thread.stack.forEach((e) => {
          let blockId = thread.target.blocks.getBlock(e).id;
          let block = Blockly.getMainWorkspace().getBlockById(blockId);
          let childblock = thread.stack.find((i) => {
            let b = block;
            while (b.childBlocks_.length) {
              b = b.childBlocks_[b.childBlocks_.length - 1];
              if (i === b.id) return true;
            }
          });
          if (!childblock && block && block.svgPath_) {
            block.svgPath_.style.filter = "url(#blueStackGlow)";
          }
        });
      });
    }, 500);
    return () => clearInterval(interval);
  }
}
