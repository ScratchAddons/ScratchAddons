// GradientModel — shared state and all gradient operations for the stop editor.
// Instantiate once per userscript run: const model = new GradientModel(addon, msg)
//
// All methods are arrow class fields so they can be passed as callbacks without .bind().

import { clamp, colorToHex, colorToCss } from "./color-utils.js";

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

export class GradientModel {
  // ── State ────────────────────────────────────────────────────────────────────

  // p0/p1: absolute positions [0, 1] for the two outer colour stop handles.
  // Invariant: linear gradients expect these at the visual endpoints (0/1); radial
  // gradients may place them inside the radius and treat the remainder as empty space.
  stops = { p0: 0, p1: 1 };
  c0hex = "#000000";
  c1hex = "#ffffff"; // hex display colours, kept in sync with Redux
  c0css = "#000000";
  c1css = "#ffffff"; // full CSS (may include rgba alpha) — source of truth for rebuilds
  // Extra middle stops between p0 and p1. Sorted by offset ascending.
  // Each entry: { color: string (css with possible rgba), offset: number }
  extraStops = [];
  lastKnownGradientType = null;
  cachedPaper = null;
  // Items whose gradient object has been force-replaced to wire up the
  // GradientStop→Gradient→Color→Item change chain for real-time canvas re-renders.
  // scratch-paint's native gradient objects have an incomplete _owner chain: setting
  // GradientStop.offset fires _changed() but it never reaches Item._changed() → canvas.
  // Cleared automatically when items are GC'd (WeakSet semantics).
  liveGradientItems = new WeakSet();
  selfItemsDispatch = false; // prevents recursion in our own CHANGE_SELECTED_ITEMS dispatch
  lastSelectedPaperItem = null; // tracks identity to detect type-switch vs fresh select
  storedAngle = 0; // degrees; persists for linear gradients across type-button presses
  activeOverlay = null;
  activeColorMode = "fill"; // "fill" | "stroke" — which color popup is currently open
  scratchClassReady = false;
  newItemPatcherActive = false;

  constructor(addon, msg) {
    this.addon = addon;
    this.msg = msg;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  colorProp = () => (this.activeColorMode === "stroke" ? "strokeColor" : "fillColor");

  // ── Swatch syncing ────────────────────────────────────────────────────────────

  // Override Scratch's swatches with the real paper.js gradients for both fill and stroke.
  // For radial gradients, normalize stop offsets against the outer stop so p0/p1 movement
  // is previewed relative to the visible radius rather than the implicit CSS center->100% range.
  syncSwatches = () => {
    if (!this.scratchClassReady) return;
    const item = this.cachedPaper?.project.selectedItems.find((i) => i.parent instanceof this.cachedPaper.Layer);
    if (!item) return;
    const swatches = document.getElementsByClassName(this.addon.tab.scratchClass("color-button_color-button-swatch"));
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

  syncUI = () => {
    this.activeOverlay?.sync();
    this.syncSwatches();
  };

  // Temporarily collapse multi-stop gradients to their outer stops so CHANGE_SELECTED_ITEMS
  // makes Redux/swatches read a stable 2-stop gradient instead of MIXED. Restore the full
  // paper.js gradient immediately afterwards; syncSwatches() then paints the richer preview.
  withCollapsedOuterStops = (items, callback) => {
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

  // CHANGE_SELECTED_ITEMS makes Scratch rebuild its own swatch preview from Redux's 2-stop model.
  // Repaint our paper.js-based preview immediately, then again on the next frame in case React
  // commits the simplified swatch after our first write.
  dispatchSelectedItems = (items) => {
    this.selfItemsDispatch = true;
    this.addon.tab.redux.dispatch({ type: "scratch-paint/select/CHANGE_SELECTED_ITEMS", selectedItems: items });
    this.selfItemsDispatch = false;
    // Redux/React can briefly repaint Scratch's simplified swatch after selection changes.
    // Apply our custom preview immediately, then again on the next frame in case it gets overwritten.
    this.syncSwatches();
    requestAnimationFrame(this.syncSwatches);
  };

  // ── Gradient read/write ───────────────────────────────────────────────────────

  // Read p0/p1, extraStops and colours from the first selected paper item.
  readCurrentStops = (paper) => {
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const gradStops = items[0]?.[this.colorProp()]?.gradient?.stops;
    if (!gradStops || gradStops.length < 2) {
      this.extraStops = [];
      return { p0: 0, p1: 1 };
    }
    this.c0hex = colorToHex(gradStops[0].color);
    this.c1hex = colorToHex(gradStops[gradStops.length - 1].color);
    this.c0css = colorToCss(gradStops[0].color);
    this.c1css = colorToCss(gradStops[gradStops.length - 1].color);
    // Read any middle stops (indices 1..n-2) into extraStops, sorted by offset.
    if (gradStops.length > 2) {
      this.extraStops = Array.from(gradStops)
        .slice(1, gradStops.length - 1)
        .map((s) => ({ color: colorToCss(s.color), offset: s.offset ?? 0.5 }))
        .sort((a, b) => a.offset - b.offset);
    } else {
      this.extraStops = [];
    }
    return {
      p0: gradStops[0].offset ?? 0,
      p1: gradStops[gradStops.length - 1].offset ?? 1,
    };
  };

  // The linear overlay treats origin/destination as the two outer stop handles, so its
  // outer stop offsets must always span the full axis. When switching from radial after
  // moving p0/p1, scratch-paint preserves those offsets, which leaves the overlay out of
  // sync and lets extra-stop drag bounds ignore the visible gradient start.
  normalizeStopsForLinear = () => {
    const { p0, p1 } = this.stops;
    const span = p1 - p0;
    if (span <= 0) {
      this.stops = { p0: 0, p1: 1 };
      this.extraStops = this.extraStops
        .map((stop) => ({ ...stop, offset: clamp(stop.offset, 0, 1) }))
        .sort((a, b) => a.offset - b.offset);
      return;
    }
    this.extraStops = this.extraStops
      .map((stop) => ({ ...stop, offset: clamp((stop.offset - p0) / span, 0, 1) }))
      .sort((a, b) => a.offset - b.offset);
    this.stops = { p0: 0, p1: 1 };
  };

  // Read the gradient axis angle (degrees, 0–359) from the first selected item.
  readCurrentAngle = (paper) => {
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const fc = items[0]?.[this.colorProp()];
    if (!fc?.gradient || fc.gradient.radial) return 0;
    const dx = fc.destination.x - fc.origin.x;
    const dy = fc.destination.y - fc.origin.y;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return Math.round(deg);
  };

  // Rotate origin/destination of all selected linear items to the given angle.
  applyAngle = (deg) => {
    if (!this.cachedPaper || this.addon.self.disabled) return;
    const rad = (deg * Math.PI) / 180;
    const dir = new this.cachedPaper.Point(Math.cos(rad), Math.sin(rad));
    for (const item of this.cachedPaper.project.selectedItems.filter(
      (i) => i.parent instanceof this.cachedPaper.Layer
    )) {
      const fc = item[this.colorProp()];
      if (!fc?.gradient || fc.gradient.radial) continue;
      const center = fc.origin.add(fc.destination).divide(2);
      const half = fc.origin.getDistance(fc.destination) / 2;
      item[this.colorProp()].origin = center.subtract(dir.multiply(half));
      item[this.colorProp()].destination = center.add(dir.multiply(half));
    }
  };

  // Commit an undo snapshot to scratch-paint's undo stack.
  triggerUndo = () => {
    const cc = document.querySelector("[class*='paint-editor_canvas-container_']");
    if (!cc) return;
    let f = cc[this.addon.tab.traps.getInternalKey(cc)];
    while (f && typeof f.stateNode?.handleUpdateImage !== "function") f = f.return;
    f?.stateNode?.handleUpdateImage();
    this.syncSwatches();
  };

  // Write all stops back to paper.js.
  // If scratch-paint wiped extra stops (grad.stops.length === 2 but extraStops exists),
  // rebuilds the full gradient including c1hex (which P4b confirmed also gets dropped).
  // Always restores all offsets afterwards.
  applyAllStops = () => {
    if (!this.cachedPaper || this.addon.self.disabled) return;
    const cp = this.colorProp();
    for (const item of this.cachedPaper.project.selectedItems.filter(
      (i) => i.parent instanceof this.cachedPaper.Layer
    )) {
      const fc = item[cp];
      const grad = fc?.gradient;
      if (!grad?.stops || grad.stops.length < 2) continue;
      if (this.extraStops.length > 0) {
        if (grad.stops.length !== this.extraStops.length + 2 || !this.liveGradientItems.has(item)) {
          // Either scratch-paint wiped extra stops, or this is the first applyAllStops call
          // for this item (liveGradientItems warm-up).  In both cases, replace the Gradient
          // object entirely: this wires the GradientStop→Gradient→Color→Item _owner chain
          // so that subsequent offset mutations trigger real-time canvas redraws.
          this.liveGradientItems.add(item);
          item[cp].gradient = {
            stops: [this.c0css, ...this.extraStops.map((s) => s.color), this.c1css],
            radial: grad.radial,
          };
        } else {
          // Already warm and count matches — update extra stop colors in-place only
          // and refresh our cached outer-stop CSS from paper.
          this.c0css = colorToCss(grad.stops[0].color);
          this.c1css = colorToCss(grad.stops[grad.stops.length - 1].color);
          this.c0hex = colorToHex(grad.stops[0].color);
          this.c1hex = colorToHex(grad.stops[grad.stops.length - 1].color);
          for (let i = 0; i < this.extraStops.length; i++) {
            if (grad.stops[i + 1]) grad.stops[i + 1].color = new this.cachedPaper.Color(this.extraStops[i].color);
          }
        }
      } else if (!this.liveGradientItems.has(item)) {
        // First applyAllStops call for a 2-stop gradient: force-replace the Gradient object
        // to wire the GradientStop→Gradient→Color→Item _owner chain for real-time redraws.
        this.liveGradientItems.add(item);
        item[cp].gradient = {
          stops: [grad.stops[0].color, grad.stops[grad.stops.length - 1].color],
          radial: grad.radial,
        };
      }
      // Fix offsets — must run after potential rebuild above.
      const g = item[cp].gradient;
      g.stops[0].offset = this.stops.p0;
      for (let i = 0; i < this.extraStops.length; i++) {
        if (g.stops[i + 1]) g.stops[i + 1].offset = this.extraStops[i].offset;
      }
      g.stops[g.stops.length - 1].offset = this.stops.p1;
    }
    this.syncSwatches();
  };

  // Inject full multi-stop gradient into a single item.
  // Precondition: item[cp] already has a 2-stop gradient matching c0hex/c1hex.
  // Used by patchLayerItems (drawing tools) and wrapFillTool (fill tool).
  injectMultiStop = (item, cp) => {
    const grad = item[cp].gradient;
    this.liveGradientItems.add(item);
    item[cp].gradient = {
      stops: [this.c0css, ...this.extraStops.map((s) => s.color), this.c1css],
      radial: grad.radial,
    };
    const g = item[cp].gradient;
    g.stops[0].offset = this.stops.p0;
    for (let i = 0; i < this.extraStops.length; i++) {
      if (g.stops[i + 1]) g.stops[i + 1].offset = this.extraStops[i].offset;
    }
    g.stops[g.stops.length - 1].offset = this.stops.p1;
  };

  // ── New-item patcher ──────────────────────────────────────────────────────────

  // scratch-paint's drawing tools call styleShape() on every drag frame, which always
  // creates a 2-stop gradient from Redux primary/secondary.  The item being drawn is always
  // appended last, so checking only activeLayer.lastChild each rAF (which fires after events
  // but before paint) is enough to win the race every frame.
  // Cost when extraStops is empty: one lastChild + length-check per frame.
  patchLayerItems = () => {
    if (!this.cachedPaper || this.extraStops.length === 0) return;
    const item = this.cachedPaper.project.activeLayer.lastChild;
    if (!item) return;
    const cp = this.colorProp();
    const grad = item[cp]?.gradient;
    if (!grad || grad.stops.length !== 2) return; // only patch the 2-stop Redux form
    if (colorToHex(grad.stops[0].color) !== this.c0hex || colorToHex(grad.stops[1].color) !== this.c1hex) return;
    // This item was just styled by scratch-paint using our outer colours — inject full gradient.
    this.injectMultiStop(item, cp);
  };

  startNewItemPatcher = () => {
    this.newItemPatcherActive = true;
    const loop = () => {
      if (this.addon.self.disabled) {
        this.newItemPatcherActive = false;
        return;
      }
      this.patchLayerItems();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
}
