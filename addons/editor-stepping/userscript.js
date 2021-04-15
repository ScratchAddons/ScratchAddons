export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;

  // Insert this amazing filter
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
  // Wait for Blockly, as it tends to not be ready sometimes...
  await addon.tab.traps.getBlockly();
  const oldStep = vm.runtime._step;
  vm.runtime._step = function () {
    document.querySelectorAll("g[style*='filter'], path[style*='filter']").forEach((e) => (e.style.filter = ""));
    vm.runtime.threads.forEach((thread) => {
      if (thread.target.blocks.forceNoGlow) return;
      thread.stack.forEach((e) => {
        let blockId = thread.target.blocks.getBlock(e).id;
        let block = Blockly.getMainWorkspace().getBlockById(blockId);
        let childblock = thread.stack.find((i) => {
          let b = block;
          if (!block) return;
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
    oldStep.call(this);
  };
}
