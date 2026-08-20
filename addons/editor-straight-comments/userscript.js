export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();

  // Original function:
  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/dragging/dragger.ts#L48
  const originalCommentDrag = Blockly.dragging.Dragger.prototype.onDrag;
  Blockly.dragging.Dragger.prototype.onDrag = function (...args) {
    originalCommentDrag.call(this, ...args);
    if (!addon.self.disabled && addon.settings.get("invert") ^ args[0].shiftKey && this.draggable.dropAnchor) {
      // Magic number 16 is from here:
      // https://github.com/scratchfoundation/scratch-blocks/blob/91c8b63/src/scratch_comment_bubble.js#L119
      this.draggable.moveTo(this.draggable.location.x, this.draggable.anchor.y - 16);
    }
  };
}
