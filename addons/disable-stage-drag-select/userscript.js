export default async ({ addon, console }) => {
  const vm = addon.tab.traps.vm;

  let shiftKeyPressed = false;
  document.addEventListener(
    "mousedown",
    function (e) {
      shiftKeyPressed = e.shiftKey;
    },
    {
      capture: true,
    }
  );

  // Do not focus sprite after dragging it
  const oldStopDrag = vm.stopDrag;
  vm.stopDrag = function (...args) {
    if (shiftKeyPressed || addon.self.disabled) return oldStopDrag.call(this, ...args);
    const setEditingTarget = this.setEditingTarget;
    this.setEditingTarget = () => {};
    const r = oldStopDrag.call(this, ...args);
    this.setEditingTarget = setEditingTarget;
    return r;
  };

  // Don't let the editor drag sprites that aren't marked as draggable
  const oldGetTargetIdForDrawableId = vm.getTargetIdForDrawableId;
  vm.getTargetIdForDrawableId = function (...args) {
    const targetId = oldGetTargetIdForDrawableId.call(this, ...args);
    if (shiftKeyPressed || addon.self.disabled) return targetId;
    if (targetId !== null) {
      const target = this.runtime.getTargetById(targetId);
      if (target && !target.draggable) {
        return null;
      }
    }
    return targetId;
  };
};
