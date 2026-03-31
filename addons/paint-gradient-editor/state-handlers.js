import { COLOR_ACTIONS, COLOR_PROPS } from "./gradient-model.js";
import { colorToHex, colorToCss, ensureHex } from "./color-utils.js";

const selectedLayerItems = (model, paper = model.cachedPaper) =>
  paper ? paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer) : [];

const inferGradientType = (paperColor) => {
  if (!paperColor?.gradient) return null;
  if (paperColor.gradient.radial) return "RADIAL";
  const dx = Math.abs(paperColor.destination.x - paperColor.origin.x);
  const dy = Math.abs(paperColor.destination.y - paperColor.origin.y);
  return dy > dx ? "VERTICAL" : "HORIZONTAL";
};

const syncSelectionThroughRedux = (model, items) => {
  model.withCollapsedOuterStops(items, () => model.dispatchSelectedItems(items));
};

const refreshModelFromSelectedGradient = (model, items, activeGradient) => {
  const selectedItem = items[0];
  const isSameItem = selectedItem === model.lastSelectedPaperItem;
  const paperCount = activeGradient.stops.length;

  if (isSameItem && model.extraStops.length > 0 && paperCount < model.extraStops.length + 2) {
    // CHANGE_SELECTED_ITEMS fired because a gradient-type switch called setSelectedItems,
    // which happens BEFORE CHANGE_FILL_GRADIENT_TYPE. Paper.js was just wiped to 2 stops
    // by applyGradientTypeToSelection, but our extraStops cache is still valid.
    // Preserve extras: update outer CSS from the 2-stop result and reinstate.
    model.c0css = colorToCss(activeGradient.stops[0].color);
    model.c0hex = colorToHex(activeGradient.stops[0].color);
    // c1css/c1hex stay from cache — stops[last] after the wipe may be an extra stop.
    model.applyAllStops();
  }

  model.lastSelectedPaperItem = selectedItem;
  const isLikelyNewDraw =
    !isSameItem &&
    !model.liveGradientItems.has(selectedItem) &&
    model.extraStops.length > 0 &&
    paperCount === 2 &&
    colorToHex(activeGradient.stops[0].color) === model.c0hex &&
    colorToHex(activeGradient.stops[1].color) === model.c1hex;
  if (isLikelyNewDraw) {
    // Re-inject the full multi-stop gradient onto the freshly drawn shape.
    model.applyAllStops();
    return;
  }
  model.stops = model.readCurrentStops(model.cachedPaper); // also updates c0css/c1css/hex
};

const applyKnownGradientType = (model, gradientType) => {
  const previousType = model.lastKnownGradientType;
  model.lastKnownGradientType = gradientType;
  if (gradientType === "VERTICAL") {
    model.storedAngle = 90;
  } else if (gradientType === "HORIZONTAL") {
    model.storedAngle = 0;
    model.applyAngle(0);
  }
  if (previousType === "RADIAL" && (gradientType === "VERTICAL" || gradientType === "HORIZONTAL")) {
    model.normalizeStopsForLinear();
  }
  model.applyAllStops();
  model.activeOverlay.sync();
};

export function setupStateHandlers(addon, model) {
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/select/CHANGE_SELECTED_ITEMS") return;
    if (model.selfItemsDispatch) return; // skip our own re-dispatch
    if (!model.cachedPaper) return;

    // Stage 1: mirror selection changes from paper.js back into our cached model state.
    // Redux stores multi-stop gradients as MIXED, so paper.js is the source of truth here.
    const items = selectedLayerItems(model);
    const activePaperColor = items[0]?.[model.colorProp()];
    const activeGradient = activePaperColor?.gradient;
    if (activeGradient || COLOR_PROPS.some((prop) => items[0]?.[prop]?.gradient)) {
      if (activeGradient) refreshModelFromSelectedGradient(model, items, activeGradient);
      syncSelectionThroughRedux(model, items);
      if (activeGradient && !model.lastKnownGradientType) {
        model.lastKnownGradientType = inferGradientType(activePaperColor);
      }
      model.activeOverlay?.sync();
      requestAnimationFrame(model.syncSwatches);
      return;
    }

    // Stage 2: keep the current gradient type alive when selection temporarily stops being a gradient.
    if (!model.activeOverlay) return;
    model.lastSelectedPaperItem = items[0] || null;
    const colorState = addon.tab.redux.state?.scratchPaint?.color?.[model.colorProp()];
    if (!colorState?.gradientType) {
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
        gradientType: model.lastKnownGradientType,
      });
    } else {
      // Reading with no items would wipe extraStops, which is wrong in fill mode.
      if (items.length > 0) {
        model.stops = model.readCurrentStops(model.cachedPaper);
      }
      model.activeOverlay.sync();
      requestAnimationFrame(model.syncSwatches);
    }
  });

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (!model.activeOverlay || addon.self.disabled) return;
    const { type } = detail.action;

    // Stage 1: respond only to modal or color/gradient updates for the active side.
    if (type === "scratch-paint/modals/OPEN_MODAL" || type === "scratch-paint/modals/CLOSE_MODAL") {
      model.activeOverlay.sync();
      return;
    }

    const isGradient = type.includes("FILL_GRADIENT") || type.includes("STROKE_GRADIENT");
    const isColor = type.includes("FILL_COLOR") || type.includes("STROKE_COLOR");
    if (!isColor && !isGradient) return;

    const relevantPrefix = model.activeColorMode === "stroke" ? "STROKE" : "FILL";
    if (!type.includes(relevantPrefix)) return;

    if (isGradient) {
      // Stage 2a: gradient-type changes update cached type and then rebuild the live gradient.
      const dispatchedType = detail.action.gradientType;
      if (dispatchedType) {
        // For multi-stop gradients Redux stores gradientType=undefined (MIXED),
        // so use the dispatched value directly.
        applyKnownGradientType(model, dispatchedType);
      } else if (dispatchedType === null) {
        model.activeOverlay.sync();
      } else {
        // scratch-paint internally wiped the type for a multi-stop gradient. Restore it.
        if (model.lastKnownGradientType) {
          addon.tab.redux.dispatch({
            type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
            gradientType: model.lastKnownGradientType,
          });
        }
      }
      return;
    }

    // Stage 2b: color changes read the freshly-wiped 2-stop paper.js gradient, then restore extras.
    // scratch-paint already rebuilt paper.js to a 2-stop gradient before dispatching,
    // so read live paper.js now.
    const liveItems = selectedLayerItems(model);
    const liveGrad = liveItems[0]?.[model.colorProp()]?.gradient;
    if (liveGrad?.stops?.length >= 2) {
      model.c0css = colorToCss(liveGrad.stops[0].color);
      model.c0hex = colorToHex(liveGrad.stops[0].color);
      // stops[last] = correct C1 except when primary (colorIndex=0) changed with extras present
      // (in that case the wipe used stops[1] = extra stop as the "other" color).
      const primaryChanged = type === COLOR_ACTIONS[model.activeColorMode].COLOR;
      if (!primaryChanged || model.extraStops.length === 0) {
        model.c1css = colorToCss(liveGrad.stops[liveGrad.stops.length - 1].color);
        model.c1hex = colorToHex(liveGrad.stops[liveGrad.stops.length - 1].color);
      }
    } else {
      const colorState = addon.tab.redux.state?.scratchPaint?.color?.[model.colorProp()];
      if (!colorState) return;
      const MIXED = "scratch-paint/style-path/mixed";
      if (colorState.primary && colorState.primary !== MIXED) {
        model.c0hex = ensureHex(colorState.primary);
        model.c0css = model.c0hex;
      }
      if (colorState.secondary && colorState.secondary !== MIXED) {
        model.c1hex = ensureHex(colorState.secondary);
        model.c1css = model.c1hex;
      }
    }

    model.applyAllStops();
    model.activeOverlay.sync();
  });
}
