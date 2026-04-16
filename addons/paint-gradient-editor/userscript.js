import { GradientOverlay } from "./overlay.js";
import { clamp, colorToHex, ensureHex, colorToCss } from "./color-utils.js";
import { setupStateHandlers, COLOR_PROPS, COLOR_ACTIONS } from "./state-handlers.js";

export default async function ({ addon, msg, console }) {
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

  // ── Shared gradient state ──────────────────────────────────────────────────────────
  // Passed by reference to overlay.js so both share the same mutable data.
  const state = {
    stops: { p0: 0, p1: 1 }, // positions [0–1] for the two outer stop handles
    c0hex: "#000000",
    c1hex: "#ffffff", // hex display colours, kept in sync with Redux
    c0css: "#000000",
    c1css: "#ffffff", // full CSS (may include rgba alpha) — source of truth for rebuilds
    extraStops: [], // middle stops between p0 and p1, sorted by offset ascending
    lastKnownGradientType: null,
    cachedPaper: null,
    storedAngle: 0, // degrees; persists for linear gradients across type-button presses
    activeOverlay: null,
    activeColorMode: "fill", // "fill" | "stroke" — which color popup is currently open
    selfItemsDispatch: false, // prevents recursion in our own CHANGE_SELECTED_ITEMS dispatch
    lastSelectedPaperItem: null, // tracks identity to detect type-switch vs fresh select
  };
  // Items whose gradient object has been force-replaced to wire up the
  // GradientStop→Gradient→Color→Item change chain for real-time canvas re-renders.
  // scratch-paint's native gradient objects have an incomplete _owner chain: setting
  // GradientStop.offset fires _changed() but it never reaches Item._changed() → canvas.
  // Cleared automatically when items are GC'd (WeakSet semantics).
  const liveGradientItems = new WeakSet();
  const syncUI = () => {
    state.activeOverlay?.sync();
    syncSwatches();
  };

  // Action type strings keyed by color mode, and fill/stroke prop names.
  // Defined in state-handlers.js; imported above so all closures share one source of truth.
  const colorProp = () => (state.activeColorMode === "stroke" ? "strokeColor" : "fillColor");
  // applyAllStops()/drag paths can run before Scratch's hashed class names are available,
  // so swatch syncing must wait until scratchClassReady resolves.
  let scratchClassReady = false;
  // CHANGE_SELECTED_ITEMS makes Scratch rebuild its own swatch preview from Redux's 2-stop model.
  // Repaint our paper.js-based preview immediately, then again on the next frame in case React
  // commits the simplified swatch after our first write.
  const dispatchSelectedItems = (items) => {
    state.selfItemsDispatch = true;
    addon.tab.redux.dispatch({ type: "scratch-paint/select/CHANGE_SELECTED_ITEMS", selectedItems: items });
    state.selfItemsDispatch = false;
    // Redux/React can briefly repaint Scratch's simplified swatch after selection changes.
    // Apply our custom preview immediately, then again on the next frame in case it gets overwritten.
    syncSwatches();
    requestAnimationFrame(syncSwatches);
  };
  addon.tab.scratchClassReady().then(() => {
    scratchClassReady = true;
    requestAnimationFrame(syncSwatches);
  });

  // Cache paper.js early so the CHANGE_SELECTED_ITEMS listener can fix MIXED
  // swatches even before the user opens a colour picker.
  // Also start the continuous new-item patcher which injects the full multi-stop
  // gradient into shapes as they are drawn live (see patchLayerItems below).
  let newItemPatcherActive = false;
  addon.tab.traps.getPaper().then((p) => {
    if (!state.cachedPaper) state.cachedPaper = p;
    if (!newItemPatcherActive) startNewItemPatcher();
  });

  // Override Scratch's swatches with the real paper.js gradients for both fill and stroke.
  // For radial gradients, normalize stop offsets against the outer stop so p0/p1 movement
  // is previewed relative to the visible radius rather than the implicit CSS center->100% range.
  const syncSwatches = () => {
    if (!scratchClassReady) return;
    const item = state.cachedPaper?.project.selectedItems.find((i) => i.parent instanceof state.cachedPaper.Layer);
    if (!item) return;
    const swatches = document.getElementsByClassName(addon.tab.scratchClass("color-button_color-button-swatch"));
    for (const [idx, prop] of [
      [0, "fillColor"],
      [1, "strokeColor"],
    ]) {
      const swatch = swatches[idx];
      const color = item[prop];
      const gradient = color?.gradient;
      if (!swatch || !gradient || gradient.stops.length < 2) continue;
      const p1 = gradient.stops[gradient.stops.length - 1].offset;
      if (gradient.radial && p1 <= 0) continue;
      const normalize = gradient.radial ? (offset) => clamp(offset / p1, 0, 1) : (offset) => clamp(offset, 0, 1);
      const stopsCss = gradient.stops.map(
        (stop) => `${colorToCss(stop.color)} ${(normalize(stop.offset) * 100).toFixed(1)}%`
      );
      if (gradient.radial) {
        swatch.style.background = `radial-gradient(${stopsCss.join(", ")})`;
      } else {
        // Derive angle from paper.js origin→destination so the swatch matches the canvas gradient.
        // CSS linear-gradient angle is clockwise from "to top"; convert from paper.js screen coords
        // (y-down) using atan2(dx, -dy): right→90°, down→180°, left→270°, up→0°.
        let angleDeg = 90; // fallback: left→right
        if (color.origin && color.destination) {
          const dx = color.destination.x - color.origin.x;
          const dy = color.destination.y - color.origin.y;
          angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
          if (angleDeg < 0) angleDeg += 360;
        }
        swatch.style.background = `linear-gradient(${angleDeg.toFixed(1)}deg, ${stopsCss.join(", ")})`;
      }
    }
  };

  // Temporarily collapse multi-stop gradients to their outer state.stops so CHANGE_SELECTED_ITEMS
  // makes Redux/swatches read a stable 2-stop gradient instead of MIXED. Restore the full
  // paper.js gradient immediately afterwards; syncSwatches() then paints the richer preview.
  const withCollapsedOuterStops = (items, callback) => {
    const snapshots = [];
    for (const item of items) {
      for (const prop of COLOR_PROPS) {
        const style = item[prop];
        const grad = style?.gradient;
        if (!grad || grad.stops.length <= 2) continue;
        const stopColors = Array.from(grad.stops).map((stop, index, arr) => ({
          color: colorToCss(stop.color),
          offset: stop.offset ?? (index === 0 ? 0 : index === arr.length - 1 ? 1 : 0.5),
        }));
        const first = stopColors[0];
        const last = stopColors[stopColors.length - 1];
        style.gradient = { stops: [first.color, last.color], radial: grad.radial };
        style.gradient.stops[0].offset = first.offset;
        style.gradient.stops[1].offset = last.offset;
        snapshots.push({ style, radial: grad.radial, stopColors });
      }
    }
    callback();
    for (const { style, radial, stopColors } of snapshots) {
      style.gradient = { stops: stopColors.map((stop) => stop.color), radial };
      for (let i = 0; i < stopColors.length; i++) {
        if (style.gradient.stops[i]) style.gradient.stops[i].offset = stopColors[i].offset;
      }
    }
  };

  // ── Read p0/p1, state.extraStops and colours from the first selected paper item ───────
  const readCurrentStops = (paper) => {
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const gradStops = items[0]?.[colorProp()]?.gradient?.stops;
    if (!gradStops || gradStops.length < 2) {
      state.extraStops = [];
      return { p0: 0, p1: 1 };
    }
    state.c0hex = colorToHex(gradStops[0].color);
    state.c1hex = colorToHex(gradStops[gradStops.length - 1].color);
    state.c0css = colorToCss(gradStops[0].color);
    state.c1css = colorToCss(gradStops[gradStops.length - 1].color);
    // Read any middle state.stops (indices 1..n-2) into state.extraStops, sorted by offset.
    if (gradStops.length > 2) {
      state.extraStops = Array.from(gradStops)
        .slice(1, gradStops.length - 1)
        .map((s) => ({ color: colorToCss(s.color), offset: s.offset ?? 0.5 }))
        .sort((a, b) => a.offset - b.offset);
    } else {
      state.extraStops = [];
    }
    return {
      p0: gradStops[0].offset ?? 0,
      p1: gradStops[gradStops.length - 1].offset ?? 1,
    };
  };

  // ── Write p0/p1 offsets back to paper.js ────────────────────────────────────────
  // Only mutates offsets — never touches colours or stop count, so scratch-paint
  // always reads exactly 2 state.stops whose colours it manages perfectly.
  // Synchronous: uses state.cachedPaper so it is safe to call from rAF/event callbacks.
  // Read the gradient axis angle (degrees, 0–359) from the first selected item.
  const readCurrentAngle = (paper) => {
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const fc = items[0]?.[colorProp()];
    if (!fc?.gradient || fc.gradient.radial) return 0;
    const dx = fc.destination.x - fc.origin.x;
    const dy = fc.destination.y - fc.origin.y;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return Math.round(deg);
  };

  // Rotate origin/destination of all selected linear items to the given angle.
  const applyAngle = (deg) => {
    if (!state.cachedPaper || addon.self.disabled) return;
    const rad = (deg * Math.PI) / 180;
    const dir = new state.cachedPaper.Point(Math.cos(rad), Math.sin(rad));
    for (const item of state.cachedPaper.project.selectedItems.filter(
      (i) => i.parent instanceof state.cachedPaper.Layer
    )) {
      const fc = item[colorProp()];
      if (!fc?.gradient || fc.gradient.radial) continue;
      const center = fc.origin.add(fc.destination).divide(2);
      const half = fc.origin.getDistance(fc.destination) / 2;
      item[colorProp()].origin = center.subtract(dir.multiply(half));
      item[colorProp()].destination = center.add(dir.multiply(half));
    }
  };

  // When switching from RADIAL, remap all extra-stop offsets into [0, 1] space so
  // nothing sits outside the draggable p0–p1 range on the new linear axis.
  const normalizeStopsForLinear = () => {
    const { p0, p1 } = state.stops;
    const span = p1 - p0;
    if (span <= 0) {
      state.stops = { p0: 0, p1: 1 };
      state.extraStops = state.extraStops
        .map((stop) => ({ ...stop, offset: clamp(stop.offset, 0, 1) }))
        .sort((a, b) => a.offset - b.offset);
      return;
    }
    state.extraStops = state.extraStops
      .map((stop) => ({ ...stop, offset: clamp((stop.offset - p0) / span, 0, 1) }))
      .sort((a, b) => a.offset - b.offset);
    state.stops = { p0: 0, p1: 1 };
  };

  // Commit an undo snapshot to scratch-paint's undo stack.
  const triggerUndo = () => {
    const cc = document.querySelector("[class*='paint-editor_canvas-container_']");
    if (!cc) return;
    let f = cc[addon.tab.traps.getInternalKey(cc)];
    while (f && typeof f.stateNode?.handleUpdateImage !== "function") f = f.return;
    f?.stateNode?.handleUpdateImage();
    syncSwatches();
  };

  // ── Write all state.stops back to paper.js ────────────────────────────────────────────
  // If scratch-paint wiped extra state.stops (grad.stops.length === 2 but state.extraStops exists),
  // rebuilds the full gradient including state.c1hex (which P4b confirmed also gets dropped).
  // Always restores all offsets afterwards.
  const applyAllStops = () => {
    if (!state.cachedPaper || addon.self.disabled) return;
    const cp = colorProp();
    for (const item of state.cachedPaper.project.selectedItems.filter(
      (i) => i.parent instanceof state.cachedPaper.Layer
    )) {
      const fc = item[cp];
      const grad = fc?.gradient;
      if (!grad?.stops || grad.stops.length < 2) continue;
      if (state.extraStops.length > 0) {
        if (grad.stops.length !== state.extraStops.length + 2 || !liveGradientItems.has(item)) {
          // Either scratch-paint wiped extra state.stops, or this is the first applyAllStops call
          // for this item (liveGradientItems warm-up).  In both cases, replace the Gradient
          // object entirely: this wires the GradientStop→Gradient→Color→Item _owner chain
          // so that subsequent offset mutations trigger real-time canvas redraws.
          liveGradientItems.add(item);
          item[cp].gradient = {
            stops: [state.c0css, ...state.extraStops.map((s) => s.color), state.c1css],
            radial: grad.radial,
          };
        } else {
          // Already warm and count matches — update extra stop colors in-place only
          // and refresh our cached outer-stop CSS from paper.
          state.c0css = colorToCss(grad.stops[0].color);
          state.c1css = colorToCss(grad.stops[grad.stops.length - 1].color);
          state.c0hex = colorToHex(grad.stops[0].color);
          state.c1hex = colorToHex(grad.stops[grad.stops.length - 1].color);
          for (let i = 0; i < state.extraStops.length; i++) {
            if (grad.stops[i + 1]) grad.stops[i + 1].color = new state.cachedPaper.Color(state.extraStops[i].color);
          }
        }
      } else if (!liveGradientItems.has(item)) {
        // First applyAllStops call for a 2-stop gradient: force-replace the Gradient object
        // to wire the GradientStop→Gradient→Color→Item _owner chain for real-time redraws.
        liveGradientItems.add(item);
        item[cp].gradient = {
          stops: [grad.stops[0].color, grad.stops[grad.stops.length - 1].color],
          radial: grad.radial,
        };
      }
      // Fix offsets — must run after potential rebuild above.
      const g = item[cp].gradient;
      g.stops[0].offset = state.stops.p0;
      for (let i = 0; i < state.extraStops.length; i++) {
        if (g.stops[i + 1]) g.stops[i + 1].offset = state.extraStops[i].offset;
      }
      g.stops[g.stops.length - 1].offset = state.stops.p1;
    }
    syncSwatches();
  };

  // ── Shared helper: inject full multi-stop gradient into a single item ─────────────────
  // Precondition: item[cp] already has a 2-stop gradient matching state.c0hex/state.c1hex.
  // Used by patchLayerItems (drawing tools) and wrapFillTool (fill tool).
  const injectMultiStop = (item, cp) => {
    const grad = item[cp].gradient;
    liveGradientItems.add(item);
    item[cp].gradient = {
      stops: [state.c0css, ...state.extraStops.map((s) => s.color), state.c1css],
      radial: grad.radial,
    };
    const g = item[cp].gradient;
    g.stops[0].offset = state.stops.p0;
    for (let i = 0; i < state.extraStops.length; i++) {
      if (g.stops[i + 1]) g.stops[i + 1].offset = state.extraStops[i].offset;
    }
    g.stops[g.stops.length - 1].offset = state.stops.p1;
  };

  // ── New-item patcher ────────────────────────────────────────────────────────────────────
  // scratch-paint's drawing tools call styleShape() on every drag frame, which always
  // creates a 2-stop gradient from Redux primary/secondary.  The item being drawn is always
  // appended last, so checking only activeLayer.lastChild each rAF (which fires after events
  // but before paint) is enough to win the race every frame.
  // Cost when state.extraStops is empty: one lastChild + length-check per frame.
  const patchLayerItems = () => {
    if (!state.cachedPaper || state.extraStops.length === 0) return;
    const item = state.cachedPaper.project.activeLayer.lastChild;
    if (!item) return;
    const cp = colorProp();
    const grad = item[cp]?.gradient;
    if (!grad || grad.stops.length !== 2) return; // only patch the 2-stop Redux form
    if (colorToHex(grad.stops[0].color) !== state.c0hex || colorToHex(grad.stops[1].color) !== state.c1hex) return;
    // This item was just styled by scratch-paint using our outer colours — inject full gradient.
    injectMultiStop(item, cp);
  };
  const startNewItemPatcher = () => {
    newItemPatcherActive = true;
    const loop = () => {
      if (addon.self.disabled) {
        newItemPatcherActive = false;
        return;
      }
      patchLayerItems();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // ── Fill tool multi-stop hook ─────────────────────────────────────────────────────────
  // scratch-paint's FillTool calls _setFillItemColor() on every mouse move/down.
  // That method always uses createGradientObject() which makes a 2-stop gradient.
  // By wrapping it we can expand 2-stop → multi-stop immediately after each call,
  // so both the hover preview AND the committed fill use the full gradient.
  // The FillTool instance is recreated on every mode switch, so we re-wrap on each
  // CHANGE_MODE → FILL dispatch.

  const wrapFillTool = () => {
    if (!state.cachedPaper) return;
    const tool = state.cachedPaper.tool;
    if (!tool || tool.__saGradHooked) return;
    // fill-mode's activateTool() resets gradientType to SOLID when the current fill is
    // stored as MIXED in Redux (which is always the case for multi-stop gradients).
    // Restore the gradient type and colours directly on the tool and via Redux so the
    // fill tool applies gradients instead of solid fills.
    // Note: the fill tool's gradient type always comes from CHANGE_FILL_GRADIENT_TYPE,
    // never from the stroke side, so we use COLOR_ACTIONS.fill regardless of state.activeColorMode.
    if (state.extraStops.length > 0 && state.lastKnownGradientType) {
      tool.setGradientType(state.lastKnownGradientType);
      tool.setFillColor(state.c0css);
      tool.setFillColor2(state.c1css);
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS.fill.GRADIENT,
        gradientType: state.lastKnownGradientType,
      });
    }
    const orig = tool._setFillItemColor?.bind(tool);
    if (!orig) return;
    tool._setFillItemColor = function (color1, color2, gradientType, pointerLocation) {
      orig(color1, color2, gradientType, pointerLocation);
      if (addon.self.disabled || state.extraStops.length === 0) return;
      const item = tool._getFillItem?.();
      if (!item) return;
      const cp = tool.fillProperty === "fill" ? "fillColor" : "strokeColor";
      const grad = item[cp]?.gradient;
      if (!grad || grad.stops.length !== 2) return;
      if (colorToHex(grad.stops[0].color) !== state.c0hex || colorToHex(grad.stops[1].color) !== state.c1hex) return;
      injectMultiStop(item, cp);
      // For linear gradients: override origin/destination to match the custom angle shown
      // in the fill preview box (state.storedAngle), spanning the item's bounding box.
      // createGradientObject() only knows HORIZONTAL/VERTICAL so any custom angle would
      // otherwise snap.  For radial, leave origin/destination alone — orig() already
      // centred the gradient on the pointer position.
      if (!grad.radial) {
        const θ = (state.storedAngle * Math.PI) / 180;
        const cosθ = Math.cos(θ);
        const sinθ = Math.sin(θ);
        const dir = new state.cachedPaper.Point(cosθ, sinθ);
        const b = item.bounds;
        const halfLen = Math.abs((b.width / 2) * cosθ) + Math.abs((b.height / 2) * sinθ) || 0.01;
        item[cp].origin = b.center.subtract(dir.multiply(halfLen));
        item[cp].destination = b.center.add(dir.multiply(halfLen));
      }
    };
    tool.__saGradHooked = true;
  };

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/modes/CHANGE_MODE") return;
    if (detail.action.mode !== "FILL") return;
    // FillMode.activateTool() runs synchronously in the same dispatch handler,
    // so state.cachedPaper.tool is already the new FillTool instance by the next rAF.
    requestAnimationFrame(wrapFillTool);
  });

  // ── Overlay interface ────────────────────────────────────────────────────────────────
  // Functions and addon API passed to overlay.js, which has no direct access to this closure.
  // Also used by state-handlers.js (setupStateHandlers) for the Redux listeners.
  const ops = {
    colorProp,
    applyAllStops,
    triggerUndo,
    withCollapsedOuterStops,
    dispatchSelectedItems,
    readCurrentAngle,
    readCurrentStops,
    applyAngle,
    normalizeStopsForLinear,
    syncSwatches,
    addon,
    msg,
  };

  // ── Redux listeners ──────────────────────────────────────────────────────────────────
  setupStateHandlers(addon, state, ops, liveGradientItems);

  // ── Main loop ──────────────────────────────────────────────────────────────────
  addon.self.addEventListener("disabled", () => {
    state.activeOverlay?.close();
    state.activeOverlay?.destroy();
    state.activeOverlay = null;
    // newItemPatcherActive is cleared by the loop itself on next rAF when it sees disabled.
  });
  addon.self.addEventListener("reenabled", () => {
    if (state.cachedPaper && !newItemPatcherActive) startNewItemPatcher();
  });

  while (true) {
    await addon.tab.waitForElement('[class*="color-picker_gradient-swatches-row_"]', {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (state.scratchGui.editorTab.activeTabIndex !== 1 || state.scratchGui.mode.isPlayerOnly) return false;
        const fillGrad = state.scratchPaint?.color?.fillColor?.gradientType;
        const strokeGrad = state.scratchPaint?.color?.strokeColor?.gradientType;
        return fillGrad !== "SOLID" || strokeGrad !== "SOLID";
      },
    });

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
    state.activeColorMode = colorModeNow;

    const colorStateNow = spColor[colorModeNow === "stroke" ? "strokeColor" : "fillColor"];
    if (!colorStateNow || colorStateNow.gradientType === "SOLID") continue;

    state.activeOverlay?.destroy();
    state.activeOverlay = null;

    const paper = await addon.tab.traps.getPaper();
    state.cachedPaper = paper;
    // In fill mode there are no selected items, so readCurrentStops would wipe
    // state.extraStops.  Keep the cached state from the last selected shape instead.
    const isFillMode = addon.tab.redux.state?.scratchPaint?.mode === "FILL";
    if (!isFillMode) {
      state.stops = readCurrentStops(paper);
      state.storedAngle = colorStateNow.gradientType === "VERTICAL" ? 90 : readCurrentAngle(paper);
    }

    if (!colorStateNow.gradientType) {
      const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
      const fg = items[0]?.[colorProp()];
      if (fg?.type !== "gradient") continue;
      const isRadial = fg.gradient?.radial;
      let inferredType;
      if (isRadial) {
        inferredType = "RADIAL";
      } else {
        const dx = Math.abs(fg.destination.x - fg.origin.x);
        const dy = Math.abs(fg.destination.y - fg.origin.y);
        inferredType = dy > dx ? "VERTICAL" : "HORIZONTAL";
      }
      state.lastKnownGradientType = inferredType;
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[state.activeColorMode].GRADIENT,
        gradientType: inferredType,
      });
    } else {
      state.lastKnownGradientType = colorStateNow.gradientType;
    }

    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    const overlayCanvas = canvasContainer?.querySelector("canvas");
    if (canvasContainer && overlayCanvas) {
      state.activeOverlay = new GradientOverlay(state, ops, paper, canvasContainer, overlayCanvas);
    }

    // scratch-paint doesn't always dispatch CLOSE_MODAL when the picker closes
    // (e.g. clicking outside the popover), but Redux modal state does update.
    // Poll via rAF to detect the close within one frame, without DOM observation.
    const pollPickerClose = () => {
      const spModals = addon.tab.redux.state?.scratchPaint?.modals;
      const stillOpen = state.activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
      if (!stillOpen) {
        state.activeOverlay?.destroy();
        state.activeOverlay = null;
      } else {
        requestAnimationFrame(pollPickerClose);
      }
    };
    requestAnimationFrame(pollPickerClose);

    // Always call applyAllStops() on overlay creation: this triggers the liveGradientItems
    // warm-up for every selected item before any drag happens, ensuring that both p0 and p1
    // handles (and the centre handle's destination changes) produce real-time canvas redraws
    // from the very first interaction — even on a fresh project load with untouched gradients.
    applyAllStops();

    // Fix MIXED swatches that appear when scratch-paint can't read the gradient on reopen.
    const MIXED = "scratch-paint/style-path/mixed";
    const colorNow = addon.tab.redux.state?.scratchPaint?.color?.[colorProp()];
    if (colorNow?.primary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[state.activeColorMode].COLOR, color: state.c0hex });
    }
    if (colorNow?.secondary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[state.activeColorMode].COLOR2, color: state.c1hex });
    }

    requestAnimationFrame(syncUI);
  }
}
