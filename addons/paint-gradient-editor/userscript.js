import StopColorPicker from "./stop-color-picker.js";

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

  // ── Stop state ──────────────────────────────────────────────────────────────────────
  // p0/p1: absolute positions [0, 1] for the two colour stop handles.
  let stops = { p0: 0, p1: 1 };
  let c0hex = "#000000",
    c1hex = "#ffffff"; // hex display colours, kept in sync with Redux
  let c0css = "#000000",
    c1css = "#ffffff"; // full CSS (may include rgba alpha) — source of truth for rebuilds
  // Extra middle stops between p0 and p1. Sorted by offset ascending.
  // Each entry: { color: string (css with possible rgba), offset: number }
  let extraStops = [];
  let lastKnownGradientType = null;
  let cachedPaper = null;
  // Items whose gradient object has been force-replaced to wire up the
  // GradientStop→Gradient→Color→Item change chain for real-time canvas re-renders.
  // scratch-paint's native gradient objects have an incomplete _owner chain: setting
  // GradientStop.offset fires _changed() but it never reaches Item._changed() → canvas.
  // Cleared automatically when items are GC'd (WeakSet semantics).
  const liveGradientItems = new WeakSet();
  let selfItemsDispatch = false; // prevents recursion in our own CHANGE_SELECTED_ITEMS dispatch
  let lastSelectedPaperItem = null; // tracks identity to detect type-switch vs fresh select
  let storedAngle = 0; // degrees; persists for linear gradients across type-button presses
  let activeOverlay = null;
  let activeColorMode = "fill"; // "fill" | "stroke" — which color popup is currently open
  const syncUI = () => {
    activeOverlay?.sync();
    syncSwatches();
  };

  // Action type strings keyed by color mode.
  const COLOR_ACTIONS = {
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
  const COLOR_PROPS = ["fillColor", "strokeColor"];
  const colorProp = () => (activeColorMode === "stroke" ? "strokeColor" : "fillColor");
  // applyAllStops()/drag paths can run before Scratch's hashed class names are available,
  // so swatch syncing must wait until scratchClassReady resolves.
  let scratchClassReady = false;
  // CHANGE_SELECTED_ITEMS makes Scratch rebuild its own swatch preview from Redux's 2-stop model.
  // Repaint our paper.js-based preview immediately, then again on the next frame in case React
  // commits the simplified swatch after our first write.
  const dispatchSelectedItems = (items) => {
    selfItemsDispatch = true;
    addon.tab.redux.dispatch({ type: "scratch-paint/select/CHANGE_SELECTED_ITEMS", selectedItems: items });
    selfItemsDispatch = false;
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
    if (!cachedPaper) cachedPaper = p;
    if (!newItemPatcherActive) startNewItemPatcher();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Convert a paper.js Color to "#rrggbb"
  const colorToHex = (c) =>
    "#" +
    [c.red, c.green, c.blue]
      .map((v) =>
        Math.round(clamp(v, 0, 1) * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("");

  // Parse "#rrggbb", "rgb(r,g,b)" or "rgba(r,g,b,a)" → [r,g,b,a] (a is 0–1), or null.
  const parseColor = (c) => {
    if (!c || typeof c !== "string") return null;
    if (c.startsWith("#") && c.length >= 7)
      return [...[0, 1, 2].map((i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16)), 1];
    const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1] : null;
  };

  // Normalise any CSS colour string to "#rrggbb" (strips alpha; redux dispatch expects hex).
  const ensureHex = (c) => {
    const arr = parseColor(c);
    return arr
      ? "#" +
          arr
            .slice(0, 3)
            .map((v) =>
              Math.round(clamp(v, 0, 255))
                .toString(16)
                .padStart(2, "0")
            )
            .join("")
      : c;
  };

  // Convert a paper.js Color to a CSS string, preserving alpha when < 1.
  const colorToCss = (c) => {
    if (!c || c.alpha === null || c.alpha === undefined || c.alpha >= 1) return colorToHex(c);
    return `rgba(${Math.round(c.red * 255)},${Math.round(c.green * 255)},${Math.round(c.blue * 255)},${Math.round(c.alpha * 1000) / 1000})`;
  };

  // Override Scratch's swatches with the real paper.js gradients for both fill and stroke.
  // For radial gradients, normalize stop offsets against the outer stop so p0/p1 movement
  // is previewed relative to the visible radius rather than the implicit CSS center->100% range.
  const syncSwatches = () => {
    if (!scratchClassReady) return;
    const item = cachedPaper?.project.selectedItems.find((i) => i.parent instanceof cachedPaper.Layer);
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

  // Temporarily collapse multi-stop gradients to their outer stops so CHANGE_SELECTED_ITEMS
  // makes Redux/swatches read a stable 2-stop gradient instead of MIXED. Restore the full
  // paper.js gradient immediately afterwards; syncSwatches() then paints the richer preview.
  const withCollapsedOuterStops = (items, callback) => {
    const snapshots = [];
    for (const item of items) {
      for (const prop of COLOR_PROPS) {
        const style = item[prop];
        const grad = style?.gradient;
        if (!grad || grad.stops.length <= 2) continue;
        const stops = Array.from(grad.stops).map((stop, index, arr) => ({
          color: colorToCss(stop.color),
          offset: stop.offset ?? (index === 0 ? 0 : index === arr.length - 1 ? 1 : 0.5),
        }));
        const first = stops[0];
        const last = stops[stops.length - 1];
        style.gradient = { stops: [first.color, last.color], radial: grad.radial };
        style.gradient.stops[0].offset = first.offset;
        style.gradient.stops[1].offset = last.offset;
        snapshots.push({ style, radial: grad.radial, stops });
      }
    }
    callback();
    for (const { style, radial, stops } of snapshots) {
      style.gradient = { stops: stops.map((stop) => stop.color), radial };
      for (let i = 0; i < stops.length; i++) {
        if (style.gradient.stops[i]) style.gradient.stops[i].offset = stops[i].offset;
      }
    }
  };

  // ── Read p0/p1, extraStops and colours from the first selected paper item ───────
  const readCurrentStops = (paper) => {
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const gradStops = items[0]?.[colorProp()]?.gradient?.stops;
    if (!gradStops || gradStops.length < 2) {
      extraStops = [];
      return { p0: 0, p1: 1 };
    }
    c0hex = colorToHex(gradStops[0].color);
    c1hex = colorToHex(gradStops[gradStops.length - 1].color);
    c0css = colorToCss(gradStops[0].color);
    c1css = colorToCss(gradStops[gradStops.length - 1].color);
    // Read any middle stops (indices 1..n-2) into extraStops, sorted by offset.
    if (gradStops.length > 2) {
      extraStops = Array.from(gradStops)
        .slice(1, gradStops.length - 1)
        .map((s) => ({ color: colorToCss(s.color), offset: s.offset ?? 0.5 }))
        .sort((a, b) => a.offset - b.offset);
    } else {
      extraStops = [];
    }
    return {
      p0: gradStops[0].offset ?? 0,
      p1: gradStops[gradStops.length - 1].offset ?? 1,
    };
  };

  // ── Write p0/p1 offsets back to paper.js ────────────────────────────────────────
  // Only mutates offsets — never touches colours or stop count, so scratch-paint
  // always reads exactly 2 stops whose colours it manages perfectly.
  // Synchronous: uses cachedPaper so it is safe to call from rAF/event callbacks.
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
    if (!cachedPaper || addon.self.disabled) return;
    const rad = (deg * Math.PI) / 180;
    const dir = new cachedPaper.Point(Math.cos(rad), Math.sin(rad));
    for (const item of cachedPaper.project.selectedItems.filter((i) => i.parent instanceof cachedPaper.Layer)) {
      const fc = item[colorProp()];
      if (!fc?.gradient || fc.gradient.radial) continue;
      const center = fc.origin.add(fc.destination).divide(2);
      const half = fc.origin.getDistance(fc.destination) / 2;
      item[colorProp()].origin = center.subtract(dir.multiply(half));
      item[colorProp()].destination = center.add(dir.multiply(half));
    }
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

  // ── Write all stops back to paper.js ────────────────────────────────────────────
  // If scratch-paint wiped extra stops (grad.stops.length === 2 but extraStops exists),
  // rebuilds the full gradient including c1hex (which P4b confirmed also gets dropped).
  // Always restores all offsets afterwards.
  const applyAllStops = () => {
    if (!cachedPaper || addon.self.disabled) return;
    const cp = colorProp();
    for (const item of cachedPaper.project.selectedItems.filter((i) => i.parent instanceof cachedPaper.Layer)) {
      const fc = item[cp];
      const grad = fc?.gradient;
      if (!grad?.stops || grad.stops.length < 2) continue;
      if (extraStops.length > 0) {
        if (grad.stops.length !== extraStops.length + 2 || !liveGradientItems.has(item)) {
          // Either scratch-paint wiped extra stops, or this is the first applyAllStops call
          // for this item (liveGradientItems warm-up).  In both cases, replace the Gradient
          // object entirely: this wires the GradientStop→Gradient→Color→Item _owner chain
          // so that subsequent offset mutations trigger real-time canvas redraws.
          liveGradientItems.add(item);
          item[cp].gradient = {
            stops: [c0css, ...extraStops.map((s) => s.color), c1css],
            radial: grad.radial,
          };
        } else {
          // Already warm and count matches — update extra stop colors in-place only
          // and refresh our cached outer-stop CSS from paper.
          c0css = colorToCss(grad.stops[0].color);
          c1css = colorToCss(grad.stops[grad.stops.length - 1].color);
          c0hex = colorToHex(grad.stops[0].color);
          c1hex = colorToHex(grad.stops[grad.stops.length - 1].color);
          for (let i = 0; i < extraStops.length; i++) {
            if (grad.stops[i + 1]) grad.stops[i + 1].color = new cachedPaper.Color(extraStops[i].color);
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
      g.stops[0].offset = stops.p0;
      for (let i = 0; i < extraStops.length; i++) {
        if (g.stops[i + 1]) g.stops[i + 1].offset = extraStops[i].offset;
      }
      g.stops[g.stops.length - 1].offset = stops.p1;
    }
    syncSwatches();
  };

  // ── Shared helper: inject full multi-stop gradient into a single item ─────────────────
  // Precondition: item[cp] already has a 2-stop gradient matching c0hex/c1hex.
  // Used by patchLayerItems (drawing tools) and wrapFillTool (fill tool).
  const injectMultiStop = (item, cp) => {
    const grad = item[cp].gradient;
    liveGradientItems.add(item);
    item[cp].gradient = { stops: [c0css, ...extraStops.map((s) => s.color), c1css], radial: grad.radial };
    const g = item[cp].gradient;
    g.stops[0].offset = stops.p0;
    for (let i = 0; i < extraStops.length; i++) {
      if (g.stops[i + 1]) g.stops[i + 1].offset = extraStops[i].offset;
    }
    g.stops[g.stops.length - 1].offset = stops.p1;
  };

  // ── New-item patcher ────────────────────────────────────────────────────────────────────
  // scratch-paint's drawing tools call styleShape() on every drag frame, which always
  // creates a 2-stop gradient from Redux primary/secondary.  The item being drawn is always
  // appended last, so checking only activeLayer.lastChild each rAF (which fires after events
  // but before paint) is enough to win the race every frame.
  // Cost when extraStops is empty: one lastChild + length-check per frame.
  const patchLayerItems = () => {
    if (!cachedPaper || extraStops.length === 0) return;
    const item = cachedPaper.project.activeLayer.lastChild;
    if (!item) return;
    const cp = colorProp();
    const grad = item[cp]?.gradient;
    if (!grad || grad.stops.length !== 2) return; // only patch the 2-stop Redux form
    if (colorToHex(grad.stops[0].color) !== c0hex || colorToHex(grad.stops[1].color) !== c1hex) return;
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

  // ── Redux listeners ──────────────────────────────────────────────────────────────────
  // CHANGE_SELECTED_ITEMS: restore gradientType if scratch-paint wiped it.
  // (With 2 stops scratch-paint reads the gradient fine, but keep this as a safety net.)
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/select/CHANGE_SELECTED_ITEMS") return;
    if (selfItemsDispatch) return; // skip our own re-dispatch
    if (!cachedPaper) return;

    // Check paper.js directly — for multi-stop gradients Redux sets gradientType=undefined
    // (shows MIXED swatches), so we must not rely on fill.gradientType alone.
    const items = cachedPaper.project.selectedItems.filter((i) => i.parent instanceof cachedPaper.Layer);
    const activePaperColor = items[0]?.[colorProp()];
    const activeGradient = activePaperColor?.gradient;
    if (activeGradient || COLOR_PROPS.some((prop) => items[0]?.[prop]?.gradient)) {
      if (activeGradient) {
        const isSameItem = items[0] === lastSelectedPaperItem;
        const paperCount = activeGradient.stops.length;

        if (isSameItem && extraStops.length > 0 && paperCount < extraStops.length + 2) {
          // CHANGE_SELECTED_ITEMS fired because a gradient-type switch called setSelectedItems,
          // which happens BEFORE CHANGE_FILL_GRADIENT_TYPE.  Paper.js was just wiped to 2 stops
          // by applyGradientTypeToSelection, but our extraStops cache is still valid.
          // Preserve extras: update outer CSS from the 2-stop result and reinstate.
          c0css = colorToCss(activeGradient.stops[0].color);
          c0hex = colorToHex(activeGradient.stops[0].color);
          // c1css/c1hex stay from cache — stops[last] after the wipe may be an extra stop
          applyAllStops();
        }

        // Normal selection change or re-select.
        // If the new item has exactly 2 stops whose outer colours match our current cache,
        // has never been processed by us, and we have extra stops cached, this is almost
        // certainly a newly drawn shape that scratch-paint colored using the Redux 2-stop
        // simplification.  Apply the full multi-stop gradient immediately instead of
        // wiping the cached state.  The activeOverlay check is intentionally omitted:
        // switching to a drawing tool closes the picker (activeOverlay→null) before
        // CHANGE_SELECTED_ITEMS fires for the new shape.
        lastSelectedPaperItem = items[0];
        const isLikelyNewDraw =
          !isSameItem &&
          !liveGradientItems.has(items[0]) &&
          extraStops.length > 0 &&
          paperCount === 2 &&
          colorToHex(activeGradient.stops[0].color) === c0hex &&
          colorToHex(activeGradient.stops[1].color) === c1hex;
        if (isLikelyNewDraw) {
          // Re-inject the full multi-stop gradient onto the freshly drawn shape.
          applyAllStops();
        } else {
          stops = readCurrentStops(cachedPaper); // also updates c0css, c1css, c0hex, c1hex
        }
      }

      // Re-dispatch selection through Redux using collapsed outer stops for both sides.
      withCollapsedOuterStops(items, () => dispatchSelectedItems(items));

      // Infer gradient type if not yet known (first selection before picker open).
      if (activeGradient && !lastKnownGradientType) {
        if (activeGradient.radial) {
          lastKnownGradientType = "RADIAL";
        } else {
          const dx = Math.abs((activePaperColor.destination?.x ?? 0) - (activePaperColor.origin?.x ?? 0));
          const dy = Math.abs((activePaperColor.destination?.y ?? 0) - (activePaperColor.origin?.y ?? 0));
          lastKnownGradientType = dy > dx ? "VERTICAL" : "HORIZONTAL";
        }
      }

      activeOverlay?.sync();
      requestAnimationFrame(syncSwatches);
      return;
    }

    // Non-gradient item selected — only restore gradient type when overlay is active.
    if (!activeOverlay) return;
    lastSelectedPaperItem = items?.[0] ?? null;
    const colorState = addon.tab.redux.state?.scratchPaint?.color?.[colorProp()];
    if (!colorState?.gradientType) {
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[activeColorMode].GRADIENT,
        gradientType: lastKnownGradientType,
      });
    } else {
      // Don't call readCurrentStops when there are no selected items (e.g. fill mode
      // clears selection on activate, and onUpdateImage dispatches CHANGE_SELECTED_ITEMS []
      // after each fill click).  Reading with no items would wipe extraStops.
      if (items.length > 0) {
        stops = readCurrentStops(cachedPaper);
      }
      activeOverlay.sync();
      requestAnimationFrame(syncSwatches);
    }
  });

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (!activeOverlay || addon.self.disabled) return;
    const { type } = detail.action;
    // When a modal opens/closes, re-evaluate overlay visibility immediately.
    if (type === "scratch-paint/modals/OPEN_MODAL" || type === "scratch-paint/modals/CLOSE_MODAL") {
      activeOverlay.sync();
      return;
    }
    const isGradient = type.includes("FILL_GRADIENT") || type.includes("STROKE_GRADIENT");
    const isColor = type.includes("FILL_COLOR") || type.includes("STROKE_COLOR");
    if (!isColor && !isGradient) return;
    // Only react to actions matching the currently-open modal.
    const relevantPrefix = activeColorMode === "stroke" ? "STROKE" : "FILL";
    if (!type.includes(relevantPrefix)) return;

    if (isGradient) {
      const dispatchedType = detail.action.gradientType;
      if (dispatchedType) {
        // A real gradient type was dispatched.  For multi-stop gradients Redux stores
        // gradientType=undefined (MIXED), so we use dispatchedType directly rather than
        // reading from Redux state, which would return null and silently skip the sync.
        // paper.js is already updated synchronously by applyGradientTypeToSelection()
        // before this dispatch fires, so no rAF deferral is needed.
        lastKnownGradientType = dispatchedType;
        if (dispatchedType === "VERTICAL") {
          storedAngle = 90;
        } else if (dispatchedType === "HORIZONTAL") {
          storedAngle = 0;
          applyAngle(0);
        }
        applyAllStops();
        activeOverlay.sync();
      } else if (dispatchedType === null) {
        // User explicitly chose SOLID (GradientTypes.SOLID = null) — hide the overlay.
        activeOverlay.sync();
      } else {
        // gradientType === undefined: scratch-paint internally wiped the type for a
        // multi-stop gradient (MIXED state).  Restore it so the overlay stays visible.
        if (lastKnownGradientType) {
          addon.tab.redux.dispatch({
            type: COLOR_ACTIONS[activeColorMode].GRADIENT,
            gradientType: lastKnownGradientType,
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
      const liveItems = cachedPaper?.project?.selectedItems?.filter((i) => i.parent instanceof cachedPaper.Layer);
      const liveGrad = liveItems?.[0]?.[colorProp()]?.gradient;
      if (liveGrad?.stops?.length >= 2) {
        // stops[0] is always the correct C0 after any applyColorToSelection wipe.
        c0css = colorToCss(liveGrad.stops[0].color);
        c0hex = colorToHex(liveGrad.stops[0].color);
        // stops[last] = correct C1 EXCEPT when primary (colorIndex=0) changed WITH extras present
        // (in that case the wipe used stops[1] = extra stop as the "other" color).
        const primaryChanged = type === COLOR_ACTIONS[activeColorMode].COLOR;
        if (!primaryChanged || extraStops.length === 0) {
          c1css = colorToCss(liveGrad.stops[liveGrad.stops.length - 1].color);
          c1hex = colorToHex(liveGrad.stops[liveGrad.stops.length - 1].color);
        }
      } else {
        // Fallback: use Redux (alpha-unaware but better than nothing)
        const colorState = addon.tab.redux.state?.scratchPaint?.color?.[colorProp()];
        if (!colorState) return;
        const MIXED = "scratch-paint/style-path/mixed";
        if (colorState.primary && colorState.primary !== MIXED) {
          c0hex = ensureHex(colorState.primary);
          c0css = c0hex;
        }
        if (colorState.secondary && colorState.secondary !== MIXED) {
          c1hex = ensureHex(colorState.secondary);
          c1css = c1hex;
        }
      }
      applyAllStops();
      activeOverlay.sync();
    }
  });

  // ── Fill tool multi-stop hook ─────────────────────────────────────────────────────────
  // scratch-paint's FillTool calls _setFillItemColor() on every mouse move/down.
  // That method always uses createGradientObject() which makes a 2-stop gradient.
  // By wrapping it we can expand 2-stop → multi-stop immediately after each call,
  // so both the hover preview AND the committed fill use the full gradient.
  // The FillTool instance is recreated on every mode switch, so we re-wrap on each
  // CHANGE_MODE → FILL dispatch.

  const wrapFillTool = () => {
    if (!cachedPaper) return;
    const tool = cachedPaper.tool;
    if (!tool || tool.__saGradHooked) return;
    // fill-mode's activateTool() resets gradientType to SOLID when the current fill is
    // stored as MIXED in Redux (which is always the case for multi-stop gradients).
    // Restore the gradient type and colours directly on the tool and via Redux so the
    // fill tool applies gradients instead of solid fills.
    // Note: the fill tool's gradient type always comes from CHANGE_FILL_GRADIENT_TYPE,
    // never from the stroke side, so we use COLOR_ACTIONS.fill regardless of activeColorMode.
    if (extraStops.length > 0 && lastKnownGradientType) {
      tool.setGradientType(lastKnownGradientType);
      tool.setFillColor(c0css);
      tool.setFillColor2(c1css);
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS.fill.GRADIENT,
        gradientType: lastKnownGradientType,
      });
    }
    const orig = tool._setFillItemColor?.bind(tool);
    if (!orig) return;
    tool._setFillItemColor = function (color1, color2, gradientType, pointerLocation) {
      orig(color1, color2, gradientType, pointerLocation);
      if (addon.self.disabled || extraStops.length === 0) return;
      const item = tool._getFillItem?.();
      if (!item) return;
      const cp = tool.fillProperty === "fill" ? "fillColor" : "strokeColor";
      const grad = item[cp]?.gradient;
      if (!grad || grad.stops.length !== 2) return;
      if (colorToHex(grad.stops[0].color) !== c0hex || colorToHex(grad.stops[1].color) !== c1hex) return;
      injectMultiStop(item, cp);
      // For linear gradients: override origin/destination to match the custom angle shown
      // in the fill preview box (storedAngle), spanning the item's bounding box.
      // createGradientObject() only knows HORIZONTAL/VERTICAL so any custom angle would
      // otherwise snap.  For radial, leave origin/destination alone — orig() already
      // centred the gradient on the pointer position.
      if (!grad.radial) {
        const θ = (storedAngle * Math.PI) / 180;
        const cosθ = Math.cos(θ);
        const sinθ = Math.sin(θ);
        const dir = new cachedPaper.Point(cosθ, sinθ);
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
    // so cachedPaper.tool is already the new FillTool instance by the next rAF.
    requestAnimationFrame(wrapFillTool);
  });

  // ── Canvas SVG overlay ────────────────────────────────────────────────────
  // Draggable handles sitting on top of the paper.js canvas.
  // mousedown calls stopPropagation so react-popover doesn't close the fill picker.
  const buildOverlay = (paper, canvasContainer, canvas) => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "sa-grad-overlay");
    svg.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:10";
    addon.tab.displayNoneWhileDisabled(svg);

    // ── SVG element helpers ───────────────────────────────────────────────
    // svgEl: create a namespaced element with all attributes set in one call.
    const svgEl = (tag, attrs = {}) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    // moveTo: set transform="translate(x,y)" on any SVG element.
    const moveTo = (el, x, y) => el.setAttribute("transform", `translate(${x},${y})`);
    // setLine: update all four endpoint attributes on a <line> in one call.
    const setLine = (el, x1, y1, x2, y2) => {
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", x2);
      el.setAttribute("y2", y2);
    };

    // Axis line: dashed for linear, solid for radial.
    // Two layers: black outline underneath + white line on top for visibility on any background.
    const axisOutline = svgEl("line", { stroke: "black", "stroke-width": 4, "stroke-opacity": 0.5 });
    svg.appendChild(axisOutline);
    const axisLine = svgEl("line", { stroke: "white", "stroke-width": 2 });
    svg.appendChild(axisLine);

    // Invisible wider hit-target on the axis line for click-to-add-stop.
    const axisHit = svgEl("line", { stroke: "transparent", "stroke-width": 12 });
    axisHit.style.cssText = "pointer-events:stroke;cursor:crosshair";
    svg.appendChild(axisHit);

    // Two-layer floating selection ring (white outer halo + black inner ring).
    // Declared here; appended to svg after the static handles so they render on top.
    // insertBefore(pickerRingWhite) is used when creating pool handles for the same reason.
    const pickerRingWhite = svgEl("circle", {
      fill: "none",
      stroke: "white",
      "stroke-width": 2,
      "pointer-events": "none",
    });
    pickerRingWhite.style.display = "none";
    const pickerRingBlack = svgEl("circle", {
      fill: "none",
      stroke: "black",
      "stroke-width": 3.5,
      "pointer-events": "none",
    });
    pickerRingBlack.style.display = "none";

    // Centre handle (radial only): hollow white circle at fc.origin; free drag shifts whole circle.
    // r=6 circle + r=8 shadow → combined outer radius 8px used for min-distance calculation.
    const makeCentreHandle = () => {
      const g = document.createElementNS(NS, "g");
      g.style.cssText = "pointer-events:all;cursor:pointer";
      g.append(
        svgEl("circle", { r: 8, fill: "rgba(0,0,0,0.3)" }),
        svgEl("circle", { r: 6, fill: "transparent", stroke: "white", "stroke-width": 2 })
      );
      svg.appendChild(g);
      return g;
    };

    // Colour-stop handles: filled circles.
    // Linear: p0 sits at fc.origin (free drag), p1 at fc.destination (free drag).
    // Radial:  p0 slides along the radius with a minimum pixel offset from centre;
    //          p1 slides freely along the radius.
    // r=7 circle + r=9 shadow → shadow outer radius 9px used for min-distance calculation.
    const makeStopHandle = () => {
      const g = document.createElementNS(NS, "g");
      g._ringR = 11;
      g.style.cssText = "pointer-events:all;cursor:pointer";
      const circle = svgEl("circle", { r: 7, stroke: "white", "stroke-width": 2 });
      g.append(svgEl("circle", { r: 9, fill: "rgba(0,0,0,0.3)" }), circle);
      svg.appendChild(g);
      return { g, circle };
    };

    // Uniform handle diameter used for cramped-spacing maths (= 2 × extra-stop shadow radius 7).
    const STOP_D = 14;

    const centreHandle = makeCentreHandle();
    const p0Handle = makeStopHandle();
    const p1Handle = makeStopHandle();
    // Append floating rings last so they render above all static handles.
    svg.appendChild(pickerRingWhite);
    svg.appendChild(pickerRingBlack);
    canvasContainer.appendChild(svg);

    const toSVG = (pt) => {
      const vp = paper.view.projectToView(pt);
      return { x: vp.x + canvas.offsetLeft, y: vp.y + canvas.offsetTop };
    };

    const toProject = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      return paper.view.viewToProject(new paper.Point(clientX - r.left, clientY - r.top));
    };

    // Project a point onto the origin->destination axis; returns t in [0,1]
    const projectOntoAxis = (pt, origin, dest) => {
      const axis = dest.subtract(origin);
      const len2 = axis.dot(axis);
      if (len2 === 0) return 0;
      return clamp(pt.subtract(origin).dot(axis) / len2, 0, 1);
    };

    // Map a logical [0,1] stop offset to an axis display fraction, reserving STOP_D pixels per
    // inner handle so circles at equal offsets touch (center-to-center = STOP_D) but don't overlap.
    // innerIdx: 0-based slot among the moveable handles (not counting fixed endpoints).
    // innerCount: total moveable handles on this axis.
    // Returns null when the axis is too short — callers fall back to the raw offset.
    const crampedFrac = (innerIdx, innerCount, offset, axisLenPx) => {
      const usable = axisLenPx - (innerCount + 1) * STOP_D;
      if (usable <= 0) return null;
      return ((innerIdx + 1) * STOP_D + offset * usable) / axisLenPx;
    };
    // Inverse: mouse rawFrac on the axis → logical [0,1] offset for a handle at innerIdx.
    const crampedToOffset = (innerIdx, innerCount, rawFrac, axisLenPx) => {
      const usable = axisLenPx - (innerCount + 1) * STOP_D;
      if (usable <= 0) return rawFrac;
      return (rawFrac * axisLenPx - (innerIdx + 1) * STOP_D) / usable;
    };

    const syncOverlay = () => {
      const spModals = addon.tab.redux.state?.scratchPaint?.modals;
      const modalForMode = activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
      if (!modalForMode || addon.self.disabled) {
        svg.style.display = "none";
        return;
      }
      const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
      const fc = items[0]?.[colorProp()];
      if (!fc?.gradient) {
        svg.style.display = "none";
        return;
      }
      svg.style.display = "";
      const isRadial = fc.gradient.radial;
      const lerp = (a, b, t) => a + (b - a) * t;

      axisLine.setAttribute("stroke-dasharray", isRadial ? "none" : "4 3");
      axisOutline.setAttribute("stroke-dasharray", isRadial ? "none" : "4 3");
      const op = toSVG(fc.origin);
      const dp = toSVG(fc.destination);
      setLine(axisLine, op.x, op.y, dp.x, dp.y);
      setLine(axisOutline, op.x, op.y, dp.x, dp.y);
      setLine(axisHit, op.x, op.y, dp.x, dp.y);

      const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
      if (isRadial) {
        // Centre handle at origin; p0/p1 slide along radius with p0 offset from centre.
        moveTo(centreHandle, op.x, op.y);
        centreHandle.style.display = "";

        // Cramp p0 so it never visually overlaps the centre or the next handle.
        const p0Frac = crampedFrac(0, 1 + extraStops.length, stops.p0, axisLenPx) ?? stops.p0;
        moveTo(p0Handle.g, lerp(op.x, dp.x, p0Frac), lerp(op.y, dp.y, p0Frac));
        // p1 sits at the destination point — the end of the visible gradient line
        moveTo(p1Handle.g, dp.x, dp.y);
      } else {
        // Linear: p0 handle sits at origin, p1 handle sits at destination (dual-function).
        centreHandle.style.display = "none";
        moveTo(p0Handle.g, op.x, op.y);
        moveTo(p1Handle.g, dp.x, dp.y);
      }

      p0Handle.circle.setAttribute("fill", c0hex);
      p1Handle.circle.setAttribute("fill", c1hex);

      // Sync extra stop handles — grow pool as needed, hide unused entries.
      // innerCount: for radial, p0 plus extras are all inner handles; for linear, only extras.
      const innerCount = isRadial ? 1 + extraStops.length : extraStops.length;
      for (let i = 0; i < extraStops.length; i++) {
        if (i >= extraHandlePool.length) extraHandlePool.push(makeExtraStopHandle(i));
        const h = extraHandlePool[i];
        const innerIdx = isRadial ? i + 1 : i;
        const t = crampedFrac(innerIdx, innerCount, extraStops[i].offset, axisLenPx) ?? extraStops[i].offset;
        const sp = { x: lerp(op.x, dp.x, t), y: lerp(op.y, dp.y, t) };
        moveTo(h.g, sp.x, sp.y);
        h.circle.setAttribute("fill", extraStops[i].color);
        // Only clear visibility if this handle is not currently being dragged off-axis.
        if (h.g !== pendingDeleteHandle) h.g.style.visibility = "";
        h.g.style.display = "";
      }
      for (let i = extraStops.length; i < extraHandlePool.length; i++) {
        const h = extraHandlePool[i];
        // If a hidden handle had the ring, clear it so the floating ring disappears.
        if (activePickerGroup === h.g) setPickerHighlight(null);
        h.g.style.display = "none";
      }
      // Keep the floating rings in sync as handles are repositioned.
      if (activePickerGroup) {
        const tf = activePickerGroup.getAttribute("transform") ?? "";
        for (const ring of [pickerRingWhite, pickerRingBlack]) ring.setAttribute("transform", tf);
      }
    };

    // Set to true by attachDrag whenever the mouse moves during a drag.
    // Extra-stop click handlers read this to suppress the click event after drag.
    let attachDragMoved = false;

    const attachDrag = (handleEl, defaultCursor, onMove, onUp) => {
      handleEl.addEventListener("mousedown", (e) => {
        if (addon.self.disabled) return;
        e.stopPropagation();
        e.preventDefault();
        attachDragMoved = false;
        handleEl.style.cursor = "grabbing";
        const moveHandler = (ev) => {
          attachDragMoved = true;
          onMove(toProject(ev.clientX, ev.clientY));
          syncOverlay();
        };
        const upHandler = () => {
          handleEl.style.cursor = defaultCursor;
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);
          if (onUp) onUp();
          else triggerUndo();
        };
        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      });
    };

    const selectedLayers = () => paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);

    // Centre handle (radial only): shift origin + destination together, preserving radius.
    attachDrag(centreHandle, "pointer", (projected) => {
      const cp = colorProp();
      for (const item of selectedLayers()) {
        const fc = item[cp];
        if (!fc?.gradient || !fc.gradient.radial) continue;
        const delta = projected.subtract(fc.origin);
        item[cp].destination = fc.destination.add(delta);
        item[cp].origin = projected;
      }
    });

    // p0 handle:
    //   Linear — free drag repositions fc.origin (the handle IS the axis start).
    //   Radial  — constrained to radius axis; cramped-space inverse maps the drag position
    //             back to a logical [0,1] offset, preventing overlap with the centre handle.
    attachDrag(p0Handle.g, "pointer", (projected) => {
      const cp = colorProp();
      const fc = selectedLayers()[0]?.[cp];
      if (!fc?.gradient) return;
      if (fc.gradient.radial) {
        const op = toSVG(fc.origin);
        const dp = toSVG(fc.destination);
        const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
        const rawFrac = projectOntoAxis(projected, fc.origin, fc.destination);
        const maxP0 = extraStops.length > 0 ? extraStops[0].offset : 1;
        stops.p0 = clamp(crampedToOffset(0, 1 + extraStops.length, rawFrac, axisLenPx), 0, maxP0);
        applyAllStops();
      } else {
        for (const item of selectedLayers()) {
          const fc = item[cp];
          if (!fc?.gradient || fc.gradient.radial) continue;
          item[cp].origin = projected;
        }
        storedAngle = readCurrentAngle(cachedPaper);
      }
    });

    // p1 handle:
    //   Linear — free drag repositions fc.destination (the handle IS the axis end).
    //   Radial  — free drag repositions fc.destination (the end of the gradient line).
    attachDrag(p1Handle.g, "pointer", (projected) => {
      const cp = colorProp();
      for (const item of selectedLayers()) {
        const fc = item[cp];
        if (!fc?.gradient) continue;
        item[cp].destination = projected;
        if (!fc.gradient.radial) storedAngle = readCurrentAngle(cachedPaper);
      }
    });

    // Sync a p0/p1 colour change (possibly including alpha) back to Redux in a way that is
    // compatible with the opacity-slider addon.
    //
    // Problem: dispatching CHANGE_FILL_COLOR with a hex string (α=1) overwrites any rgba that
    // Redux already holds for the stop.  The opacity-slider reads its alpha from Redux, so its
    // handle goes stale and the next slider interaction snaps to the stale position.
    //
    // Fix: use the same 2-stop-collapse → CHANGE_SELECTED_ITEMS approach we already use
    // elsewhere.  _colorStateFromGradient calls stop.color.toCSS() which returns "rgba(...)"
    // when α<1 — so Redux primary/secondary get the full colour including alpha ✓.
    // Then dispatch CHANGE_COLOR_INDEX with the matching index (0=p0, 1=p1) so the opacity
    // addon's prevEventHandler re-reads and repositions its handle.
    const syncPickerColorToRedux = (colorIndex) => {
      const items = selectedLayers();
      if (!items.length) return;
      // Collapse both fill and stroke to their outer stops during the Redux refresh so the
      // non-active swatch does not fall back to MIXED when the active stop colour changes.
      withCollapsedOuterStops(items, () => dispatchSelectedItems(items));
      // Trigger the opacity-slider addon to re-read Redux and update its handle position.
      addon.tab.redux.dispatch({ type: "scratch-paint/color-index/CHANGE_COLOR_INDEX", index: colorIndex });
    };

    // Click p0 to colour-pick the first stop; reflects change (including alpha) via Redux.
    p0Handle.g.addEventListener("click", (e) => {
      if (addon.self.disabled || attachDragMoved) return;
      e.stopPropagation();
      setPickerHighlight(p0Handle.g);
      picker.open(
        c0css,
        (css) => {
          c0css = css;
          c0hex = ensureHex(css);
          const cp = colorProp();
          for (const item of selectedLayers()) {
            const g = item[cp]?.gradient;
            if (g?.stops?.length >= 1) g.stops[0].color = new paper.Color(css);
          }
          applyAllStops();
          syncOverlay();
          syncPickerColorToRedux(0);
        },
        e.clientX,
        e.clientY
      );
    });

    // Click p1 to colour-pick the last stop; reflects change (including alpha) via Redux.
    p1Handle.g.addEventListener("click", (e) => {
      if (addon.self.disabled || attachDragMoved) return;
      e.stopPropagation();
      setPickerHighlight(p1Handle.g);
      picker.open(
        c1css,
        (css) => {
          c1css = css;
          c1hex = ensureHex(css);
          const cp = colorProp();
          for (const item of selectedLayers()) {
            const g = item[cp]?.gradient;
            if (g?.stops?.length >= 2) g.stops[g.stops.length - 1].color = new paper.Color(css);
          }
          applyAllStops();
          syncOverlay();
          syncPickerColorToRedux(1);
        },
        e.clientX,
        e.clientY
      );
    });

    // ── Extra stop handle pool ────────────────────────────────────────────
    // Smaller handles (r=5 circle, r=7 shadow) sit between p0 and p1 on the axis.
    // Pool grows as needed; excess handles are hidden when extraStops shrinks.
    const extraHandlePool = [];

    // Cleanly remove extra stop at idx: rebuild all selected-item gradients without it
    // (so the WeakSet warm-up count stays consistent), then splice and re-sync.
    const removeExtraStop = (idx) => {
      const previewExtra = extraStops.filter((_, i) => i !== idx);
      const cp = colorProp();
      for (const item of selectedLayers()) {
        if (!item[cp]?.gradient) continue;
        const liveStops = item[cp].gradient.stops;
        const c0 = liveStops[0].color;
        const c1 = liveStops[liveStops.length - 1].color;
        item[cp].gradient = { stops: [c0, ...previewExtra.map((s) => s.color), c1], radial: item[cp].gradient.radial };
        const g2 = item[cp].gradient;
        g2.stops[0].offset = stops.p0;
        for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
        g2.stops[g2.stops.length - 1].offset = stops.p1;
      }
      extraStops.splice(idx, 1);
      applyAllStops();
      syncOverlay();
    };

    const makeExtraStopHandle = (poolIndex) => {
      const g = document.createElementNS(NS, "g");
      g._ringR = 9;
      g.style.cssText = "pointer-events:all;cursor:pointer";
      const circle = svgEl("circle", { r: 5, stroke: "white", "stroke-width": 1.5 });
      g.append(svgEl("circle", { r: 7, fill: "rgba(0,0,0,0.3)" }), circle);
      // Insert before the floating rings so the rings always stay on top.
      svg.insertBefore(g, pickerRingWhite);

      // Colour pick on handle click — only if the mouse didn't move (not a drag).
      g.addEventListener("click", (e) => {
        if (addon.self.disabled) return;
        if (attachDragMoved) return;
        e.stopPropagation();
        openExtraColorPicker(poolIndex, e.clientX, e.clientY, g);
      });

      // Double-click deletes this stop.
      g.addEventListener("dblclick", (e) => {
        if (addon.self.disabled || attachDragMoved) return;
        e.stopPropagation();
        picker.close();
        removeExtraStop(poolIndex);
        triggerUndo();
      });

      // Drag: constrained to axis between neighbours.
      // If dragged > 25px perpendicular to the axis, enter "pending delete" state.
      // Visual: handle is hidden and the gradient previews without this stop.
      // On mouseup while pending the stop is removed; otherwise it snaps back.
      let pendingDelete = false;
      // True while this stop is in pending-delete state AND had the selection ring;
      // used to restore the ring on snap-back and close the picker on actual delete.
      let pendingDeleteSuppressedRing = false;
      attachDrag(
        g,
        "pointer",
        (projected) => {
          const idx = poolIndex;
          const fc = selectedLayers()[0]?.[colorProp()];
          if (!fc?.gradient || !extraStops[idx]) return;
          // Compute perpendicular pixel distance from the gradient axis.
          const A = fc.origin;
          const B = fc.destination;
          const axis = B.subtract(A);
          const len = axis.length;
          const wasPending = pendingDelete;
          if (len > 0) {
            const axisUnit = axis.divide(len);
            const along = projected.subtract(A).dot(axisUnit);
            const axisClosest = A.add(axisUnit.multiply(along));
            const mView = paper.view.projectToView(projected);
            const aView = paper.view.projectToView(axisClosest);
            const perpPx = Math.sqrt((mView.x - aView.x) ** 2 + (mView.y - aView.y) ** 2);
            pendingDelete = perpPx > 25;
          }
          // Entering pending-delete: hide the ring if this node has it.
          if (pendingDelete && !wasPending) {
            pendingDeleteHandle = g;
            if (activePickerGroup === g) {
              setPickerHighlight(null);
              pendingDeleteSuppressedRing = true;
            }
          }
          // Snapping back from pending-delete: restore the ring.
          if (!pendingDelete && wasPending) {
            pendingDeleteHandle = null;
            if (pendingDeleteSuppressedRing) {
              setPickerHighlight(g, 9);
              pendingDeleteSuppressedRing = false;
            }
          }
          if (pendingDelete) {
            g.style.visibility = "hidden";
            // Preview the gradient without this stop.
            const previewExtra = extraStops.filter((_, i) => i !== poolIndex);
            const item = selectedLayers()[0];
            const cp = colorProp();
            if (item?.[cp]?.gradient) {
              const liveStops = item[cp].gradient.stops;
              const liveC0 = liveStops[0].color;
              const liveC1 = liveStops[liveStops.length - 1].color;
              item[cp].gradient = {
                stops: [liveC0, ...previewExtra.map((s) => s.color), liveC1],
                radial: item[cp].gradient.radial,
              };
              const g2 = item[cp].gradient;
              g2.stops[0].offset = stops.p0;
              for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
              g2.stops[g2.stops.length - 1].offset = stops.p1;
            }
          } else {
            g.style.visibility = "";
            circle.setAttribute("fill", extraStops[idx]?.color ?? "#888");
            const rawFrac = projectOntoAxis(projected, A, B);
            const opSVG = toSVG(A),
              dpSVG = toSVG(B);
            const lenPx = Math.hypot(dpSVG.x - opSVG.x, dpSVG.y - opSVG.y);
            const isRad = fc.gradient.radial;
            const innerIdx = isRad ? idx + 1 : idx;
            const innerCount = isRad ? extraStops.length + 1 : extraStops.length;
            const leftBound = idx === 0 ? (isRad ? stops.p0 : 0) : extraStops[idx - 1].offset;
            const rightBound = idx === extraStops.length - 1 ? stops.p1 : extraStops[idx + 1].offset;
            extraStops[idx].offset = clamp(
              crampedToOffset(innerIdx, innerCount, rawFrac, lenPx),
              leftBound,
              rightBound
            );
            applyAllStops();
          }
        },
        () => {
          if (pendingDelete) {
            pendingDelete = false;
            pendingDeleteHandle = null;
            // Ring was already hidden when we entered pending-delete; close the picker too.
            if (pendingDeleteSuppressedRing) {
              pendingDeleteSuppressedRing = false;
              picker.close();
            }
            removeExtraStop(poolIndex);
          } else {
            // Restore visibility in case we entered pending-delete then moved back.
            g.style.visibility = "";
            circle.setAttribute("fill", extraStops[poolIndex]?.color ?? "#888");
          }
          triggerUndo();
        }
      );

      return { g, circle };
    };

    // Handle currently being dragged off-axis (pending-delete); syncOverlay skips its visibility reset.
    let pendingDeleteHandle = null;
    // Track which handle group currently has the picker open.
    let activePickerGroup = null;
    const setPickerHighlight = (group) => {
      activePickerGroup = group ?? null;
      if (!group) {
        pickerRingWhite.style.display = "none";
        pickerRingBlack.style.display = "none";
        return;
      }
      const ringR = group._ringR ?? 11;
      const tf = group.getAttribute("transform") ?? "";
      // White ring peeks outside the black ring; black ring is at the specified radius.
      for (const [ring, r] of [
        [pickerRingWhite, ringR + 2.5],
        [pickerRingBlack, ringR],
      ]) {
        ring.setAttribute("r", r);
        ring.setAttribute("transform", tf);
        ring.style.display = "";
      }
    };

    const picker = new StopColorPicker({
      msg,
      redux: addon.tab.redux,
      triggerUndo,
      getCachedPaper: () => cachedPaper,
      onClose: () => setPickerHighlight(null),
    });
    const openExtraColorPicker = (idx, clientX, clientY, groupEl = null) => {
      if (!extraStops[idx]) return;
      setPickerHighlight(groupEl);
      picker.open(
        extraStops[idx].color,
        (color) => {
          if (extraStops[idx]) {
            extraStops[idx].color = color;
            applyAllStops();
            syncOverlay();
          }
        },
        clientX,
        clientY
      );
    };

    // Single click on the axis line adds a new stop at that position.
    // mousedown stops propagation so the fill popup doesn't close.
    let axisMouseDownPos = null;
    axisHit.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      axisMouseDownPos = { x: e.clientX, y: e.clientY };
    });
    axisHit.addEventListener("click", (e) => {
      if (addon.self.disabled) return;
      e.stopPropagation();
      // Ignore if the mouse moved more than 4px — treat as a drag, not a click.
      if (
        axisMouseDownPos &&
        (Math.abs(e.clientX - axisMouseDownPos.x) > 4 || Math.abs(e.clientY - axisMouseDownPos.y) > 4)
      )
        return;
      const fc = selectedLayers()[0]?.[colorProp()];
      if (!fc?.gradient) return;
      const projected = toProject(e.clientX, e.clientY);
      const t = projectOntoAxis(projected, fc.origin, fc.destination);
      // Interpolate colour (+ alpha) between the two adjacent stops.
      // Use live paper.js stop colours so outer-stop alpha is included.
      const liveStops = fc.gradient.stops;
      const allStops = [
        { color: colorToCss(liveStops[0].color), offset: stops.p0 },
        ...extraStops,
        { color: colorToCss(liveStops[liveStops.length - 1].color), offset: stops.p1 },
      ];
      let left = allStops[0],
        right = allStops[allStops.length - 1];
      for (let i = 0; i < allStops.length - 1; i++) {
        if (allStops[i].offset <= t && allStops[i + 1].offset >= t) {
          left = allStops[i];
          right = allStops[i + 1];
          break;
        }
      }
      const span = right.offset - left.offset || 1;
      const lerpT = (t - left.offset) / span;
      const lc = parseColor(left.color) ?? [128, 128, 128, 1];
      const rc = parseColor(right.color) ?? [128, 128, 128, 1];
      const br = Math.round(lc[0] + (rc[0] - lc[0]) * lerpT);
      const bg = Math.round(lc[1] + (rc[1] - lc[1]) * lerpT);
      const bb = Math.round(lc[2] + (rc[2] - lc[2]) * lerpT);
      const ba = lc[3] + (rc[3] - lc[3]) * lerpT;
      const hex2 = (v) =>
        Math.round(clamp(v, 0, 255))
          .toString(16)
          .padStart(2, "0");
      const blended =
        ba >= 0.999 ? `#${hex2(br)}${hex2(bg)}${hex2(bb)}` : `rgba(${br},${bg},${bb},${Math.round(ba * 1000) / 1000})`;
      // t is the raw axis fraction of the click (proportional to pixel distance).
      // crampedFrac shifts displayed handle positions inward to avoid overlap, so we must
      // invert that mapping to find the logical offset whose display position matches the click.
      const isRadial = fc.gradient.radial;
      const op = toSVG(fc.origin);
      const dp = toSVG(fc.destination);
      const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
      // Clicking before p0 in a radial gradient: promote the click position as the new p0,
      // pushing the current p0 into extra stops so the rest of the gradient is preserved.
      if (isRadial && t < stops.p0) {
        extraStops.unshift({ color: c0css, offset: stops.p0 });
        stops.p0 = clamp(crampedToOffset(0, extraStops.length + 2, t, axisLenPx), 0, stops.p0 - 0.01);
        applyAllStops();
        syncOverlay();
        triggerUndo();
        attachDragMoved = false;
        p0Handle.g.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: e.clientX, clientY: e.clientY }));
        return;
      }
      const newInnerIdx = extraStops.filter((s) => s.offset < t).length;
      const newInnerCount = isRadial ? extraStops.length + 2 : extraStops.length + 1;
      const innerIdxForNew = isRadial ? newInnerIdx + 1 : newInnerIdx;
      const offset = crampedToOffset(innerIdxForNew, newInnerCount, t, axisLenPx);
      const newStop = { color: blended, offset: clamp(offset, stops.p0 + 0.01, stops.p1 - 0.01) };
      extraStops.push(newStop);
      extraStops.sort((a, b) => a.offset - b.offset);
      applyAllStops();
      syncOverlay(); // grows pool so the new handle exists
      const newIdx = extraStops.indexOf(newStop);
      // syncOverlay() above has grown the pool, so the handle group exists.
      openExtraColorPicker(newIdx, e.clientX, e.clientY, extraHandlePool[newIdx]?.g);
      triggerUndo();
    });

    let active = true;
    let lastKey = "";
    const rafLoop = () => {
      if (!active) return;
      const m = paper.view.matrix;
      const key = `${m.a.toFixed(3)},${m.tx.toFixed(1)},${m.ty.toFixed(1)}`;
      if (key !== lastKey) {
        lastKey = key;
        syncOverlay();
      }
      requestAnimationFrame(rafLoop);
    };
    requestAnimationFrame(rafLoop);

    return {
      sync: syncOverlay,
      close: () => picker.close(),
      destroy: () => {
        active = false;
        svg.remove();
      },
    };
  };

  // ── Main loop ──────────────────────────────────────────────────────────────────
  addon.self.addEventListener("disabled", () => {
    activeOverlay?.close();
    activeOverlay?.destroy();
    activeOverlay = null;
    // newItemPatcherActive is cleared by the loop itself on next rAF when it sees disabled.
  });
  addon.self.addEventListener("reenabled", () => {
    if (cachedPaper && !newItemPatcherActive) startNewItemPatcher();
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
    activeColorMode = colorModeNow;

    const colorStateNow = spColor[colorModeNow === "stroke" ? "strokeColor" : "fillColor"];
    if (!colorStateNow || colorStateNow.gradientType === "SOLID") continue;

    activeOverlay?.destroy();
    activeOverlay = null;

    const paper = await addon.tab.traps.getPaper();
    cachedPaper = paper;
    // In fill mode there are no selected items, so readCurrentStops would wipe
    // extraStops.  Keep the cached state from the last selected shape instead.
    const isFillMode = addon.tab.redux.state?.scratchPaint?.mode === "FILL";
    if (!isFillMode) {
      stops = readCurrentStops(paper);
      storedAngle = colorStateNow.gradientType === "VERTICAL" ? 90 : readCurrentAngle(paper);
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
        const dx = Math.abs((fg.destination?.x ?? 0) - (fg.origin?.x ?? 0));
        const dy = Math.abs((fg.destination?.y ?? 0) - (fg.origin?.y ?? 0));
        inferredType = dy > dx ? "VERTICAL" : "HORIZONTAL";
      }
      lastKnownGradientType = inferredType;
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[activeColorMode].GRADIENT,
        gradientType: inferredType,
      });
    } else {
      lastKnownGradientType = colorStateNow.gradientType;
    }

    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    const overlayCanvas = canvasContainer?.querySelector("canvas");
    if (canvasContainer && overlayCanvas) {
      activeOverlay = buildOverlay(paper, canvasContainer, overlayCanvas);
    }

    // scratch-paint doesn't always dispatch CLOSE_MODAL when the picker closes
    // (e.g. clicking outside the popover), but Redux modal state does update.
    // Poll via rAF to detect the close within one frame, without DOM observation.
    const pollPickerClose = () => {
      const spModals = addon.tab.redux.state?.scratchPaint?.modals;
      const stillOpen = activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
      if (!stillOpen) {
        activeOverlay?.destroy();
        activeOverlay = null;
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
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[activeColorMode].COLOR, color: c0hex });
    }
    if (colorNow?.secondary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[activeColorMode].COLOR2, color: c1hex });
    }

    requestAnimationFrame(syncUI);
  }
}
