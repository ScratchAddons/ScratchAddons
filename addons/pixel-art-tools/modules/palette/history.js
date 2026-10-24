const DRAWING_MODES = ["BIT_BRUSH", "BIT_LINE", "BIT_RECT", "BIT_OVAL", "BIT_FILL"];

/** @typedef {import("../types.js").PixelArtState} PixelArtState */

/**
 * @param {PixelArtState} state
 */
export function createPaletteHistory(addon, state, redux, restore, addDrawingColor) {
  // Keep palette changes beside Scratch's immutable artwork snapshots. Weak keys
  // let discarded redo entries and old costumes release their palette history.
  let changes = new WeakMap();
  let editSnapshot = null;
  const endEdit = () => (editSnapshot = null);
  const clear = () => {
    changes = new WeakMap();
    endEdit();
  };
  addon.self.addEventListener("disabled", clear);

  redux.addEventListener("statechanged", ({ detail: { action, prev, next } }) => {
    const before = prev.scratchPaint.undo;
    const after = next.scratchPaint.undo;
    if (addon.self.disabled || before === after) return;
    if (action.type === "scratch-paint/undo/CLEAR") return clear();
    if (action.type === "scratch-paint/undo/SNAPSHOT") {
      endEdit();
      // Add drawing colors to the stroke's own undo step, after it is recorded.
      // Ignore initial costume snapshots and snapshots created for swatches.
      if (
        state.enabled &&
        before.pointer >= 0 &&
        !changes.has(action.snapshot) &&
        DRAWING_MODES.includes(next.scratchPaint.mode)
      ) {
        addDrawingColor();
      }
      return;
    }
    const undo = action.type === "scratch-paint/undo/UNDO";
    if (!undo && action.type !== "scratch-paint/undo/REDO") return;
    endEdit();
    const change = changes.get(undo ? before.stack[before.pointer] : after.stack[after.pointer]);
    if (change) restore(change.paletteId, undo ? change.before : change.after);
  });

  const record = (palette, before, { editing = false, drawing = false } = {}) => {
    const undo = redux.state.scratchPaint.undo;
    const current = undo.stack[undo.pointer];
    // Scratch clears its history while loading another costume.
    if (addon.self.disabled || !current) return;
    // A continuous swatch edit is one step until another action or swatch click.
    if (editing && current === editSnapshot) {
      changes.get(current).after = palette.colors.slice();
      return;
    }
    const snapshot = drawing ? current : { ...current };
    changes.set(snapshot, { paletteId: palette.id, before, after: palette.colors.slice() });
    if (!drawing) redux.dispatch({ type: "scratch-paint/undo/SNAPSHOT", snapshot });
    editSnapshot = editing ? snapshot : null;
  };

  return { record, endEdit };
}
