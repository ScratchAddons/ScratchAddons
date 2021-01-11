export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.onceValues.vm;
  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", { markAsSeen: true });
    let mode = false;
    button.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.cancelBubble = true;
        e.preventDefault();
        mode = !mode;
        if (mode) vm.editingTarget.blocks.runtime.audioEngine.audioContext.suspend();
        else vm.editingTarget.blocks.runtime.audioEngine.audioContext.resume();
      }
    });
  }
}
