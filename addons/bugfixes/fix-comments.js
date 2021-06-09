export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();
  const originalObjectFocus = Blockly.ScratchBlockComment.prototype.textareaFocus_;
  const originalObjectMove = Blockly.ScratchBubble.prototype.setAnchorLocation;

  Blockly.ScratchBlockComment.prototype.textareaFocus_ = function (e) {
    if (!addon.self.disabled && addon.settings.get("fix-comments")) {
      return e.stopPropagation();
    } else {
      return originalObjectFocus.call(this, e);
    }
  };

  Blockly.ScratchBubble.prototype.setAnchorLocation = function (xy) {
    if (!addon.self.disabled && addon.settings.get("fix-comments")) {
      var event = new Blockly.Events.CommentMove(this.comment);
      this.anchorXY_ = xy;
      if (this.rendered_) {
        this.positionBubble_();
      }
      event.recordNew();
      Blockly.Events.fire(event);
    } else {
      return originalObjectMove.call(this, xy);
    }
  };

  if (addon.self.enabledLate) vm.emitWorkspaceUpdate();
}
