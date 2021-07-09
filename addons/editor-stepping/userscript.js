export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;

  const setColor = () =>
    document.getElementById("editor-stepping-flood").setAttribute("flood-color", addon.settings.get("highlight-color"));

  document.body.insertAdjacentHTML(
    "beforeend",
    `
<svg style="position: fixed; top: -999999%;">
  <filter id="colorStackGlow" height="160%" width="180%" y="-30%" x="-40%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4">
    </feGaussianBlur>

    <feComponentTransfer result="outBlur">
      <feFuncA type="table" tableValues="0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1">
      </feFuncA>
    </feComponentTransfer>

    <feFlood id="editor-stepping-flood" flood-color="blue" flood-opacity="1" result="outColor">
    </feFlood>

    <feComposite in="outColor" in2="outBlur" operator="in" result="outGlow">
    </feComposite>

    <feComposite in="SourceGraphic" in2="outGlow" operator="over">
    </feComposite>
  </filter>
</svg>
`
  );
  setColor();
  // Wait for Blockly, as it tends to not be ready sometimes...
  await addon.tab.traps.getBlockly();
  const elementsWithFilter = new Set();
  const oldStep = vm.runtime.constructor.prototype._step;
  vm.runtime.constructor.prototype._step = function (...args) {
    oldStep.call(this, ...args);
    for (const el of elementsWithFilter) {
      el.style.filter = "";
    }
    elementsWithFilter.clear();
    if (!addon.self.disabled) {
      vm.runtime.threads.forEach((thread) => {
        if (thread.target.blocks.forceNoGlow) return;
        thread.stack.forEach((blockId) => {
          const block = Blockly.getMainWorkspace().getBlockById(blockId);
          if (!block) {
            return;
          }
          const childblock = thread.stack.find((i) => {
            let b = block;
            while (b.childBlocks_.length) {
              b = b.childBlocks_[b.childBlocks_.length - 1];
              if (i === b.id) return true;
            }
            return false;
          });
          if (!childblock && block.svgPath_) {
            const svgPath = block.svgPath_;
            svgPath.style.filter = "url(#colorStackGlow)";
            elementsWithFilter.add(svgPath);
          }
        });
      });
    }
  };

  addon.settings.addEventListener("change", setColor);
}
