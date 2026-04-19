import { colorToHex, colorToCss, ensureHex } from "./color-utils.js";

// Action type strings keyed by color mode.
export const COLOR_ACTIONS = {
  fill: {
    COLOR: "scratch-paint/fill-style/CHANGE_FILL_COLOR",
    COLOR2: "scratch-paint/fill-style/CHANGE_FILL_COLOR_2",
    GRADIENT: "scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE",
  },
  stroke: {
    COLOR: "scratch-paint/stroke-style/CHANGE_STROKE_COLOR",
    COLOR2: "scratch-paint/stroke-style/CHANGE_STROKE_COLOR_2",
    GRADIENT: "scratch-paint/stroke-style/CHANGE_STROKE_GRADIENT_TYPE",
  },
};

// fill/stroke swatches are updated together: Redux only stores a 2-stop simplification,
// but either side may actually have a multi-stop paper.js gradient.
export const COLOR_PROPS = ["fillColor", "strokeColor"];

// Register the two main Redux state-change listeners that drive the gradient editor.
// ops must include: colorProp, applyAllStops, withCollapsedOuterStops, dispatchSelectedItems,
//                   readCurrentStops, applyAngle, normalizeStopsForLinear, syncSwatches
export function setupStateHandlers(addon, state, ops, liveGradientItems) {
  // CHANGE_SELECTED_ITEMS: restore gradientType if scratch-paint wiped it.
  // (With 2 state.stops scratch-paint reads the gradient fine, but keep this as a safety net.)
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/select/CHANGE_SELECTED_ITEMS") return;
    if (state.selfItemsDispatch) return; // skip our own re-dispatch
    if (!state.cachedPaper) return;

    // Check paper.js directly — for multi-stop gradients Redux sets gradientType=undefined
    // (shows MIXED swatches), so we must not rely on fill.gradientType alone.
    const items = state.cachedPaper.project.selectedItems.filter((i) => i.parent instanceof state.cachedPaper.Layer);
    const activePaperColor = items[0]?.[ops.colorProp()];
    const activeGradient = activePaperColor?.gradient;
    if (activeGradient || COLOR_PROPS.some((prop) => items[0]?.[prop]?.gradient)) {
      if (activeGradient) {
        const isSameItem = items[0] === state.lastSelectedPaperItem;
        const paperCount = activeGradient.stops.length;

        if (isSameItem && state.extraStops.length > 0 && paperCount < state.extraStops.length + 2) {
          // CHANGE_SELECTED_ITEMS fired because a gradient-type switch called setSelectedItems,
          // which happens BEFORE CHANGE_FILL_GRADIENT_TYPE.  Paper.js was just wiped to 2 state.stops
          // by applyGradientTypeToSelection, but our state.extraStops cache is still valid.
          // Preserve extras: update outer CSS from the 2-stop result and reinstate.
          state.c0css = colorToCss(activeGradient.stops[0].color);
          state.c0hex = colorToHex(activeGradient.stops[0].color);
          // state.c1css/state.c1hex stay from cache — state.stops[last] after the wipe may be an extra stop
          ops.applyAllStops();
        }

        // Normal selection change or re-select.
        // If the new item has exactly 2 state.stops whose outer colours match our current cache,
        // has never been processed by us, and we have extra state.stops cached, this is almost
        // certainly a newly drawn shape that scratch-paint colored using the Redux 2-stop
        // simplification.  Apply the full multi-stop gradient immediately instead of
        // wiping the cached state.  The state.activeOverlay check is intentionally omitted:
        // switching to a drawing tool closes the picker (state.activeOverlay→null) before
        // CHANGE_SELECTED_ITEMS fires for the new shape.
        state.lastSelectedPaperItem = items[0];
        const isLikelyNewDraw =
          !isSameItem &&
          !liveGradientItems.has(items[0]) &&
          state.extraStops.length > 0 &&
          paperCount === 2 &&
          colorToHex(activeGradient.stops[0].color) === state.c0hex &&
          colorToHex(activeGradient.stops[1].color) === state.c1hex;
        if (isLikelyNewDraw) {
          // Re-inject the full multi-stop gradient onto the freshly drawn shape.
          ops.applyAllStops();
        } else {
          state.stops = ops.readCurrentStops(state.cachedPaper); // also updates state.c0css, state.c1css, state.c0hex, state.c1hex
        }
      }

      // Re-dispatch selection through Redux using collapsed outer state.stops for both sides.
      ops.withCollapsedOuterStops(items, () => ops.dispatchSelectedItems(items));

      // Infer gradient type if not yet known (first selection before picker open).
      if (activeGradient && !state.lastKnownGradientType) {
        if (activeGradient.radial) {
          state.lastKnownGradientType = "RADIAL";
        } else {
          const dx = Math.abs(activePaperColor.destination.x - activePaperColor.origin.x);
          const dy = Math.abs(activePaperColor.destination.y - activePaperColor.origin.y);
          state.lastKnownGradientType = dy > dx ? "VERTICAL" : "HORIZONTAL";
        }
      }

      state.activeOverlay?.sync();
      requestAnimationFrame(ops.syncSwatches);
      return;
    }

    // Non-gradient item selected — only restore gradient type when overlay is active.
    if (!state.activeOverlay) return;
    state.lastSelectedPaperItem = items[0] || null;
    const colorState = addon.tab.redux.state?.scratchPaint?.color?.[ops.colorProp()];
    if (!colorState?.gradientType) {
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[state.activeColorMode].GRADIENT,
        gradientType: state.lastKnownGradientType,
      });
    } else {
      // Don't call readCurrentStops when there are no selected items (e.g. fill mode
      // clears selection on activate, and onUpdateImage dispatches CHANGE_SELECTED_ITEMS []
      // after each fill click).  Reading with no items would wipe state.extraStops.
      if (items.length > 0) {
        state.stops = ops.readCurrentStops(state.cachedPaper);
      }
      state.activeOverlay.sync();
      requestAnimationFrame(ops.syncSwatches);
    }
  });

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (!state.activeOverlay || addon.self.disabled) return;
    const { type } = detail.action;
    // When a modal opens/closes, re-evaluate overlay visibility immediately.
    if (type === "scratch-paint/modals/OPEN_MODAL" || type === "scratch-paint/modals/CLOSE_MODAL") {
      state.activeOverlay.sync();
      return;
    }
    const isGradient = type.includes("FILL_GRADIENT") || type.includes("STROKE_GRADIENT");
    const isColor = type.includes("FILL_COLOR") || type.includes("STROKE_COLOR");
    if (!isColor && !isGradient) return;
    // Only react to actions matching the currently-open modal.
    const relevantPrefix = state.activeColorMode === "stroke" ? "STROKE" : "FILL";
    if (!type.includes(relevantPrefix)) return;

    if (isGradient) {
      const dispatchedType = detail.action.gradientType;
      if (dispatchedType) {
        // A real gradient type was dispatched.  For multi-stop gradients Redux stores
        // gradientType=undefined (MIXED), so we use dispatchedType directly rather than
        // reading from Redux state, which would return null and silently skip the sync.
        // paper.js is already updated synchronously by applyGradientTypeToSelection()
        // before this dispatch fires, so no rAF deferral is needed.
        const previousType = state.lastKnownGradientType;
        state.lastKnownGradientType = dispatchedType;
        if (dispatchedType === "VERTICAL") {
          state.storedAngle = 90;
        } else if (dispatchedType === "HORIZONTAL") {
          state.storedAngle = 0;
          ops.applyAngle(0);
        }
        if (previousType === "RADIAL" && (dispatchedType === "VERTICAL" || dispatchedType === "HORIZONTAL")) {
          ops.normalizeStopsForLinear();
        }
        ops.applyAllStops();
        state.activeOverlay.sync();
      } else if (dispatchedType === null) {
        // User explicitly chose SOLID (GradientTypes.SOLID = null) — hide the overlay.
        state.activeOverlay.sync();
      } else {
        // gradientType === undefined: scratch-paint internally wiped the type for a
        // multi-stop gradient (MIXED state).  Restore it so the overlay stays visible.
        if (state.lastKnownGradientType) {
          addon.tab.redux.dispatch({
            type: COLOR_ACTIONS[state.activeColorMode].GRADIENT,
            gradientType: state.lastKnownGradientType,
          });
        }
      }
    } else {
      // Colour changed (e.g. new colour picked, opacity slider, or Swap).
      // applyColorToSelection (paper.js wipe to 2 state.stops) runs BEFORE the Redux dispatch,
      // so paper.js is already wiped when our listener fires — call synchronously (no flicker).
      //
      // CRITICAL: after the wipe, state.stops[0] is always the correctly-set C0, but state.stops[last]
      // may be an *extra* stop when the primary color (colorIndex=0) changed WITH extras present.
      // Read state.c0css/state.c1css from paper.js BEFORE applyAllStops uses them for the rebuild.
      const liveItems = state.cachedPaper?.project?.selectedItems?.filter(
        (i) => i.parent instanceof state.cachedPaper.Layer
      );
      const liveGrad = liveItems?.[0]?.[ops.colorProp()]?.gradient;
      if (liveGrad?.stops?.length >= 2) {
        // state.stops[0] is always the correct C0 after any applyColorToSelection wipe.
        state.c0css = colorToCss(liveGrad.stops[0].color);
        state.c0hex = colorToHex(liveGrad.stops[0].color);
        // state.stops[last] = correct C1 EXCEPT when primary (colorIndex=0) changed WITH extras present
        // (in that case the wipe used state.stops[1] = extra stop as the "other" color).
        const primaryChanged = type === COLOR_ACTIONS[state.activeColorMode].COLOR;
        if (!primaryChanged || state.extraStops.length === 0) {
          state.c1css = colorToCss(liveGrad.stops[liveGrad.stops.length - 1].color);
          state.c1hex = colorToHex(liveGrad.stops[liveGrad.stops.length - 1].color);
        }
      } else {
        // Fallback: use Redux (alpha-unaware but better than nothing)
        const colorState = addon.tab.redux.state?.scratchPaint?.color?.[ops.colorProp()];
        if (!colorState) return;
        const MIXED = "scratch-paint/style-path/mixed";
        if (colorState.primary && colorState.primary !== MIXED) {
          state.c0hex = ensureHex(colorState.primary);
          state.c0css = state.c0hex;
        }
        if (colorState.secondary && colorState.secondary !== MIXED) {
          state.c1hex = ensureHex(colorState.secondary);
          state.c1css = state.c1hex;
        }
      }
      ops.applyAllStops();
      state.activeOverlay.sync();
    }
  });
}
