/**
 * When a block with a comment attached is dragged, the comment now properly
 * stores its updated position.
 * https://github.com/LLK/scratch-blocks/blob/develop/core/scratch_bubble.js#L536
 */
export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();
  const originalMove = Blockly.ScratchBubble.prototype.setAnchorLocation;
  Blockly.ScratchBubble.prototype.setAnchorLocation = function (xy) {
    if (!addon.self.disabled && addon.settings.get("fix-drag")) {
      var event = new Blockly.Events.CommentMove(this.comment);
      this.anchorXY_ = xy;
      if (this.rendered_) {
        this.positionBubble_();
      }
      event.recordNew();
      Blockly.Events.fire(event);
    } else {
      return originalMove.call(this, xy);
    }
  };
}
