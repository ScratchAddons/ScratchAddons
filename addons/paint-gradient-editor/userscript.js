import { GradientModel, COLOR_ACTIONS, COLOR_PROPS } from "./gradient-model.js";
import { colorToHex, colorToCss, ensureHex } from "./color-utils.js";
import { buildOverlay } from "./overlay.js";
import { setupFillToolHook } from "./fill-tool-hook.js";

export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  addon.tab.redux.initialize();

  // If the Redux store wasn't created yet when initialize() ran (runAtComplete:false timing),
  // target will be undefined. Retry once it becomes available so that all registered
  // addon.tab.redux.addEventListener("statechanged", ...) listeners start receiving events.
  if (!addon.tab.redux.initialized) {
    (async () => {
      while (!window.__scratchAddonsRedux?.target) {
        await new Promise((r) => setTimeout(r, 50));
      }
      addon.tab.redux.initialize();
    })();
  }

  const model = new GradientModel(addon, msg);

  // ── Redux listeners ──────────────────────────────────────────────────────────────────
  // CHANGE_SELECTED_ITEMS: restore gradientType if scratch-paint wiped it.
  // (With 2 stops scratch-paint reads the gradient fine, but keep this as a safety net.)
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/select/CHANGE_SELECTED_ITEMS") return;
    if (model.selfItemsDispatch) return; // skip our own re-dispatch
    if (!model.cachedPaper) return;

    // Check paper.js directly — for multi-stop gradients Redux sets gradientType=undefined
    // (shows MIXED swatches), so we must not rely on fill.gradientType alone.
    const items = model.cachedPaper.project.selectedItems.filter((i) => i.parent instanceof model.cachedPaper.Layer);
    const activePaperColor = items[0]?.[model.colorProp()];
    const activeGradient = activePaperColor?.gradient;
    if (activeGradient || COLOR_PROPS.some((prop) => items[0]?.[prop]?.gradient)) {
      if (activeGradient) {
        const isSameItem = items[0] === model.lastSelectedPaperItem;
        const paperCount = activeGradient.stops.length;

        if (isSameItem && model.extraStops.length > 0 && paperCount < model.extraStops.length + 2) {
          // CHANGE_SELECTED_ITEMS fired because a gradient-type switch called setSelectedItems,
          // which happens BEFORE CHANGE_FILL_GRADIENT_TYPE.  Paper.js was just wiped to 2 stops
          // by applyGradientTypeToSelection, but our extraStops cache is still valid.
          // Preserve extras: update outer CSS from the 2-stop result and reinstate.
          model.c0css = colorToCss(activeGradient.stops[0].color);
          model.c0hex = colorToHex(activeGradient.stops[0].color);
          // c1css/c1hex stay from cache — stops[last] after the wipe may be an extra stop
          model.applyAllStops();
        }

        // Normal selection change or re-select.
        // If the new item has exactly 2 stops whose outer colours match our current cache,
        // has never been processed by us, and we have extra stops cached, this is almost
        // certainly a newly drawn shape that scratch-paint colored using the Redux 2-stop
        // simplification.  Apply the full multi-stop gradient immediately instead of
        // wiping the cached state.  The activeOverlay check is intentionally omitted:
        // switching to a drawing tool closes the picker (activeOverlay→null) before
        // CHANGE_SELECTED_ITEMS fires for the new shape.
        model.lastSelectedPaperItem = items[0];
        const isLikelyNewDraw =
          !isSameItem &&
          !model.liveGradientItems.has(items[0]) &&
          model.extraStops.length > 0 &&
          paperCount === 2 &&
          colorToHex(activeGradient.stops[0].color) === model.c0hex &&
          colorToHex(activeGradient.stops[1].color) === model.c1hex;
        if (isLikelyNewDraw) {
          // Re-inject the full multi-stop gradient onto the freshly drawn shape.
          model.applyAllStops();
        } else {
          model.stops = model.readCurrentStops(model.cachedPaper); // also updates c0css/c1css/hex
        }
      }

      // Re-dispatch selection through Redux using collapsed outer stops for both sides.
      model.withCollapsedOuterStops(items, () => model.dispatchSelectedItems(items));

      // Infer gradient type if not yet known (first selection before picker open).
      if (activeGradient && !model.lastKnownGradientType) {
        if (activeGradient.radial) {
          model.lastKnownGradientType = "RADIAL";
        } else {
          const dx = Math.abs((activePaperColor.destination?.x ?? 0) - (activePaperColor.origin?.x ?? 0));
          const dy = Math.abs((activePaperColor.destination?.y ?? 0) - (activePaperColor.origin?.y ?? 0));
          model.lastKnownGradientType = dy > dx ? "VERTICAL" : "HORIZONTAL";
        }
      }

      model.activeOverlay?.sync();
      requestAnimationFrame(model.syncSwatches);
      return;
    }

    // Non-gradient item selected — only restore gradient type when overlay is active.
    if (!model.activeOverlay) return;
    model.lastSelectedPaperItem = items?.[0] ?? null;
    const colorState = addon.tab.redux.state?.scratchPaint?.color?.[model.colorProp()];
    if (!colorState?.gradientType) {
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
        gradientType: model.lastKnownGradientType,
      });
    } else {
      // Don't call readCurrentStops when there are no selected items (e.g. fill mode
      // clears selection on activate, and onUpdateImage dispatches CHANGE_SELECTED_ITEMS []
      // after each fill click).  Reading with no items would wipe extraStops.
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
    // When a modal opens/closes, re-evaluate overlay visibility immediately.
    if (type === "scratch-paint/modals/OPEN_MODAL" || type === "scratch-paint/modals/CLOSE_MODAL") {
      model.activeOverlay.sync();
      return;
    }
    const isGradient = type.includes("FILL_GRADIENT") || type.includes("STROKE_GRADIENT");
    const isColor = type.includes("FILL_COLOR") || type.includes("STROKE_COLOR");
    if (!isColor && !isGradient) return;
    // Only react to actions matching the currently-open modal.
    const relevantPrefix = model.activeColorMode === "stroke" ? "STROKE" : "FILL";
    if (!type.includes(relevantPrefix)) return;

    if (isGradient) {
      const dispatchedType = detail.action.gradientType;
      if (dispatchedType) {
        const previousType = model.lastKnownGradientType;
        // A real gradient type was dispatched.  For multi-stop gradients Redux stores
        // gradientType=undefined (MIXED), so we use dispatchedType directly rather than
        // reading from Redux state, which would return null and silently skip the sync.
        // paper.js is already updated synchronously by applyGradientTypeToSelection()
        // before this dispatch fires, so no rAF deferral is needed.
        model.lastKnownGradientType = dispatchedType;
        if (dispatchedType === "VERTICAL") {
          model.storedAngle = 90;
        } else if (dispatchedType === "HORIZONTAL") {
          model.storedAngle = 0;
          model.applyAngle(0);
        }
        if (previousType === "RADIAL" && (dispatchedType === "VERTICAL" || dispatchedType === "HORIZONTAL")) {
          model.normalizeStopsForLinear();
        }
        model.applyAllStops();
        model.activeOverlay.sync();
      } else if (dispatchedType === null) {
        // User explicitly chose SOLID (GradientTypes.SOLID = null) — hide the overlay.
        model.activeOverlay.sync();
      } else {
        // gradientType === undefined: scratch-paint internally wiped the type for a
        // multi-stop gradient (MIXED state).  Restore it so the overlay stays visible.
        if (model.lastKnownGradientType) {
          addon.tab.redux.dispatch({
            type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
            gradientType: model.lastKnownGradientType,
          });
        }
      }
    } else {
      // Colour changed (e.g. new colour picked, opacity slider, or Swap).
      // applyColorToSelection (paper.js wipe to 2 stops) runs BEFORE the Redux dispatch,
      // so paper.js is already wiped when our listener fires — call synchronously (no flicker).
      //
      // CRITICAL: after the wipe, stops[0] is always the correctly-set C0, but stops[last]
      // may be an *extra* stop when the primary color (colorIndex=0) changed WITH extras present.
      // Read c0css/c1css from paper.js BEFORE applyAllStops uses them for the rebuild.
      const liveItems = model.cachedPaper?.project?.selectedItems?.filter(
        (i) => i.parent instanceof model.cachedPaper.Layer
      );
      const liveGrad = liveItems?.[0]?.[model.colorProp()]?.gradient;
      if (liveGrad?.stops?.length >= 2) {
        // stops[0] is always the correct C0 after any applyColorToSelection wipe.
        model.c0css = colorToCss(liveGrad.stops[0].color);
        model.c0hex = colorToHex(liveGrad.stops[0].color);
        // stops[last] = correct C1 EXCEPT when primary (colorIndex=0) changed WITH extras present
        // (in that case the wipe used stops[1] = extra stop as the "other" color).
        const primaryChanged = type === COLOR_ACTIONS[model.activeColorMode].COLOR;
        if (!primaryChanged || model.extraStops.length === 0) {
          model.c1css = colorToCss(liveGrad.stops[liveGrad.stops.length - 1].color);
          model.c1hex = colorToHex(liveGrad.stops[liveGrad.stops.length - 1].color);
        }
      } else {
        // Fallback: use Redux (alpha-unaware but better than nothing)
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
    }
  });

  setupFillToolHook(model, addon);

  // ── Lifecycle ────────────────────────────────────────────────────────────────────────
  addon.self.addEventListener("disabled", () => {
    model.activeOverlay?.close();
    model.activeOverlay?.destroy();
    model.activeOverlay = null;
    // newItemPatcherActive is cleared by the loop itself on next rAF when it sees disabled.
  });
  addon.self.addEventListener("reenabled", () => {
    if (model.cachedPaper && !model.newItemPatcherActive) model.startNewItemPatcher();
  });

  // Cache paper.js early so the CHANGE_SELECTED_ITEMS listener can fix MIXED
  // swatches even before the user opens a colour picker.
  // Also start the continuous new-item patcher which injects the full multi-stop
  // gradient into shapes as they are drawn live (see patchLayerItems in GradientModel).
  addon.tab.traps.getPaper().then((p) => {
    if (!model.cachedPaper) model.cachedPaper = p;
    if (!model.newItemPatcherActive) model.startNewItemPatcher();
  });

  addon.tab.scratchClassReady().then(() => {
    model.scratchClassReady = true;
    requestAnimationFrame(model.syncSwatches);
  });

  // ── Main loop ────────────────────────────────────────────────────────────────────────
  while (true) {
    // 1. Wait until a gradient colour picker is open in the vector editor.
    await addon.tab.waitForElement('[class*="color-picker_gradient-swatches-row_"]', {
      markAsSeen: true,
      reduxCondition: (reduxState) => {
        if (reduxState.scratchGui.editorTab.activeTabIndex !== 1 || reduxState.scratchGui.mode.isPlayerOnly)
          return false;
        const fillGrad = reduxState.scratchPaint?.color?.fillColor?.gradientType;
        const strokeGrad = reduxState.scratchPaint?.color?.strokeColor?.gradientType;
        return fillGrad !== "SOLID" || strokeGrad !== "SOLID";
      },
    });

    // 2. Determine which modal (fill or stroke) triggered the open.
    const spModals = addon.tab.redux.state?.scratchPaint?.modals;
    const spColor = addon.tab.redux.state?.scratchPaint?.color;
    let colorModeNow;
    if (spModals?.fillColor && spColor?.fillColor?.gradientType !== "SOLID") {
      colorModeNow = "fill";
    } else if (spModals?.strokeColor && spColor?.strokeColor?.gradientType !== "SOLID") {
      colorModeNow = "stroke";
    } else {
      continue;
    }
    model.activeColorMode = colorModeNow;

    const colorStateNow = spColor[colorModeNow === "stroke" ? "strokeColor" : "fillColor"];
    if (!colorStateNow || colorStateNow.gradientType === "SOLID") continue;

    // 3. Tear down any overlay left over from a previous open.
    model.activeOverlay?.destroy();
    model.activeOverlay = null;

    // 4. Read current gradient state from paper.js.
    const paper = await addon.tab.traps.getPaper();
    model.cachedPaper = paper;
    // In fill mode there are no selected items, so readCurrentStops would wipe
    // extraStops.  Keep the cached state from the last selected shape instead.
    const isFillMode = addon.tab.redux.state?.scratchPaint?.mode === "FILL";
    if (!isFillMode) {
      model.stops = model.readCurrentStops(paper);
      model.storedAngle = colorStateNow.gradientType === "VERTICAL" ? 90 : model.readCurrentAngle(paper);
    }

    // 5. Resolve gradient type — infer from paper.js when Redux shows MIXED (undefined).
    if (!colorStateNow.gradientType) {
      const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
      const fg = items[0]?.[model.colorProp()];
      if (fg?.type !== "gradient") continue;
      const isRadial = fg.gradient?.radial;
      let inferredType;
      if (isRadial) {
        inferredType = "RADIAL";
      } else {
        const dx = Math.abs((fg.destination?.x ?? 0) - (fg.origin?.x ?? 0));
        const dy = Math.abs((fg.destination?.y ?? 0) - (fg.origin?.y ?? 0));
        inferredType = dy > dx ? "VERTICAL" : "HORIZONTAL";
      }
      model.lastKnownGradientType = inferredType;
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
        gradientType: inferredType,
      });
    } else {
      model.lastKnownGradientType = colorStateNow.gradientType;
    }

    // 6. Build the SVG overlay on the canvas.
    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    const overlayCanvas = canvasContainer?.querySelector("canvas");
    if (canvasContainer && overlayCanvas) {
      model.activeOverlay = buildOverlay(paper, canvasContainer, overlayCanvas, model);
    }

    // 7. Poll for picker close — scratch-paint doesn't always dispatch CLOSE_MODAL
    // (e.g. clicking outside the popover), but Redux modal state does update.
    const pollPickerClose = () => {
      const spModals = addon.tab.redux.state?.scratchPaint?.modals;
      const stillOpen = model.activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
      if (!stillOpen) {
        model.activeOverlay?.destroy();
        model.activeOverlay = null;
      } else {
        requestAnimationFrame(pollPickerClose);
      }
    };
    requestAnimationFrame(pollPickerClose);

    // 8. Warm up liveGradientItems and fix any MIXED swatches on reopen.
    // applyAllStops() wires the GradientStop→Item owner chain so the first handle
    // drag produces a live canvas redraw without needing a prior interaction.
    model.applyAllStops();
    const MIXED = "scratch-paint/style-path/mixed";
    const colorNow = addon.tab.redux.state?.scratchPaint?.color?.[model.colorProp()];
    if (colorNow?.primary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[model.activeColorMode].COLOR, color: model.c0hex });
    }
    if (colorNow?.secondary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[model.activeColorMode].COLOR2, color: model.c1hex });
    }

    // 9. Sync the overlay and swatches to the current state.
    requestAnimationFrame(model.syncUI);
  }
}
