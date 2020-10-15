export default async function ({ addon, global, console }) {
  const virtualMachine = addon.tab.traps.onceValues.vm;
  const removeHighlight = () =>
    Array.prototype.forEach.call(document.querySelectorAll("path[style*='outline' i]"), (e) =>
      e.removeAttribute("style")
    );
  const retireThread = virtualMachine.runtime.sequencer.__proto__.retireThread;
  virtualMachine.runtime.sequencer.__proto__.retireThread = function (...args) {
    removeHighlight();
    return retireThread.apply(this, args);
  };
  addon.tab.traps.addManyListener("thread", (e) => {
    if (e[addon.tab.traps.numMany] && e[addon.tab.traps.numMany] > 1) return;
    const workspace = addon.tab.traps.onceValues.workspace;
    const thread = e.detail.value;
    const threadAccessKey = Symbol();
    Object.defineProperty(thread, threadAccessKey, {
      value: thread.blockGlowInFrame,
      writable: true,
    });
    Object.defineProperty(thread, "blockGlowInFrame", {
      get: function () {
        return this[threadAccessKey];
      },
      set: function (v) {
        this[threadAccessKey] = v;
        if (workspace && addon.tab.editorMode === "editor") {
          removeHighlight();
          const block = workspace.getAllBlocks().find((b) => b.id === v);
          if (block && block.svgPath_) block.svgPath_.style.outline = "5px solid blue";
        }
      },
    });
  });
}
