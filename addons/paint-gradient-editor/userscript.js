export default async function ({ addon, msg, console }) {
  addon.tab.redux.initialize();

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
  let selfItemsDispatch = false; // prevents recursion in our own CHANGE_SELECTED_ITEMS dispatch
  let lastSelectedPaperItem = null; // tracks identity to detect type-switch vs fresh select
  let storedAngle = 0; // degrees; persists for linear gradients across type-button presses
  let activeOverlay = null;
  let activeColorMode = "fill"; // "fill" | "stroke" — which color popup is currently open
  const syncUI = () => activeOverlay?.sync();

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
  const colorProp = () => (activeColorMode === "stroke" ? "strokeColor" : "fillColor");

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

  const getColorState = () => {
    const state = addon.tab.redux.state?.scratchPaint;
    if (state?.modals?.fillColor) {
      activeColorMode = "fill";
      const fill = state.color?.fillColor;
      if (!fill || fill.gradientType === "SOLID" || !fill.gradientType) return null;
      return fill;
    }
    if (state?.modals?.strokeColor) {
      activeColorMode = "stroke";
      const stroke = state.color?.strokeColor;
      if (!stroke || stroke.gradientType === "SOLID" || !stroke.gradientType) return null;
      return stroke;
    }
    return null;
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
    const cc = document.querySelector("[class^='paint-editor_canvas-container']");
    if (!cc) return;
    let f = cc[addon.tab.traps.getInternalKey(cc)];
    while (f && typeof f.stateNode?.handleUpdateImage !== "function") f = f.return;
    f?.stateNode?.handleUpdateImage();
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
        if (grad.stops.length !== extraStops.length + 2) {
          // scratch-paint wiped extra stops — rebuild using cached c0css/c1css.
          // These are set from the last clean readCurrentStops or from the COLOR handler
          // BEFORE the wipe result is visible, so they always carry the correct outer colours
          // including any alpha set by the opacity addon.
          item[cp].gradient = {
            stops: [c0css, ...extraStops.map((s) => s.color), c1css],
            radial: grad.radial,
          };
        } else {
          // Stop count is already correct — update extra stop colors in-place only
          // and refresh our cached outer-stop CSS from paper.
          c0css = colorToCss(grad.stops[0].color);
          c1css = colorToCss(grad.stops[grad.stops.length - 1].color);
          c0hex = colorToHex(grad.stops[0].color);
          c1hex = colorToHex(grad.stops[grad.stops.length - 1].color);
          for (let i = 0; i < extraStops.length; i++) {
            if (grad.stops[i + 1]) grad.stops[i + 1].color = new cachedPaper.Color(extraStops[i].color);
          }
        }
      }
      // Fix offsets — must run after potential rebuild above.
      const g = item[cp].gradient;
      g.stops[0].offset = stops.p0;
      for (let i = 0; i < extraStops.length; i++) {
        if (g.stops[i + 1]) g.stops[i + 1].offset = extraStops[i].offset;
      }
      g.stops[g.stops.length - 1].offset = stops.p1;
    }
  };

  // ── Redux listeners ──────────────────────────────────────────────────────────────────
  // CHANGE_SELECTED_ITEMS: restore gradientType if scratch-paint wiped it.
  // (With 2 stops scratch-paint reads the gradient fine, but keep this as a safety net.)
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/select/CHANGE_SELECTED_ITEMS") return;
    if (selfItemsDispatch) return; // skip our own re-dispatch
    if (!lastKnownGradientType || !activeOverlay) return;

    // Check paper.js directly — for multi-stop gradients Redux sets gradientType=undefined
    // (shows MIXED swatches), so we must not rely on fill.gradientType alone.
    const items = cachedPaper?.project?.selectedItems?.filter((i) => i.parent instanceof cachedPaper.Layer);
    const paperFc = items?.[0]?.[colorProp()];
    if (paperFc?.gradient) {
      const isSameItem = items[0] === lastSelectedPaperItem;
      const paperCount = paperFc.gradient.stops.length;

      if (isSameItem && extraStops.length > 0 && paperCount < extraStops.length + 2) {
        // CHANGE_SELECTED_ITEMS fired because a gradient-type switch called setSelectedItems,
        // which happens BEFORE CHANGE_FILL_GRADIENT_TYPE.  Paper.js was just wiped to 2 stops
        // by applyGradientTypeToSelection, but our extraStops cache is still valid.
        // Preserve extras: update outer CSS from the 2-stop result and reinstate.
        c0css = colorToCss(paperFc.gradient.stops[0].color);
        c0hex = colorToHex(paperFc.gradient.stops[0].color);
        // c1css/c1hex stay from cache — stops[last] after the wipe may be an extra stop
        applyAllStops();
        activeOverlay.sync();
        return;
      }

      // Normal selection change or re-select — read all stops fresh.
      lastSelectedPaperItem = items[0];
      stops = readCurrentStops(cachedPaper); // also updates c0css, c1css, c0hex, c1hex

      if (extraStops.length > 0) {
        // paper.js has n stops → _colorStateFromGradient returns MIXED, so Redux.primary = MIXED
        // and the opacity slider shows 100%.  Fix: temporarily collapse to 2 outer stops so the
        // reducer can read the real colours (with alpha), then reinstate the extras.
        const gradStops = items[0][colorProp()].gradient.stops; // re-read after readCurrentStops
        const tmpC0 = gradStops[0].color;
        const tmpC1 = gradStops[gradStops.length - 1].color;
        items[0][colorProp()].gradient = { stops: [tmpC0, tmpC1], radial: items[0][colorProp()].gradient.radial };
        selfItemsDispatch = true;
        addon.tab.redux.dispatch({
          type: "scratch-paint/select/CHANGE_SELECTED_ITEMS",
          selectedItems: items,
        });
        selfItemsDispatch = false;
        // Reinstate extra stops now that Redux has the correct outer colours.
        applyAllStops();
      }

      activeOverlay.sync();
      return;
    }

    lastSelectedPaperItem = items?.[0] ?? null;
    const colorState = addon.tab.redux.state?.scratchPaint?.color?.[colorProp()];
    if (!colorState?.gradientType) {
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[activeColorMode].GRADIENT,
        gradientType: lastKnownGradientType,
      });
    } else {
      stops = readCurrentStops(cachedPaper);
      activeOverlay.sync();
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
        const cs = getColorState();
        if (cs) {
          lastKnownGradientType = cs.gradientType;
          applyAllStops();
          requestAnimationFrame(() => {
            const currentType = addon.tab.redux.state?.scratchPaint?.color?.[colorProp()]?.gradientType;
            applyAllStops();
            if (currentType === "VERTICAL") {
              storedAngle = 90;
            } else if (currentType === "HORIZONTAL") {
              storedAngle = 0;
              applyAngle(0);
            }
            activeOverlay.sync();
          });
        }
      } else {
        // gradientType set to undefined — restore if we can.
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
    const axisLine = svgEl("line", { stroke: "white", "stroke-width": 1.5, "stroke-opacity": 0.75 });
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
      const op = toSVG(fc.origin);
      const dp = toSVG(fc.destination);
      setLine(axisLine, op.x, op.y, dp.x, dp.y);
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
      const cp = colorProp();
      // Temporarily collapse every selected item to its 2 outer stops so that
      // getColorsFromSelection reads the correct rgba from paper.js.
      for (const item of items) {
        const grd = item[cp]?.gradient;
        if (!grd?.stops?.length >= 2) continue;
        const c0c = grd.stops[0].color;
        const c1c = grd.stops[grd.stops.length - 1].color;
        item[cp].gradient = { stops: [c0c, c1c], radial: grd.radial };
      }
      selfItemsDispatch = true;
      addon.tab.redux.dispatch({ type: "scratch-paint/select/CHANGE_SELECTED_ITEMS", selectedItems: items });
      selfItemsDispatch = false;
      applyAllStops(); // reinstate extra stops for all items
      // Trigger the opacity-slider addon to re-read Redux and update its handle position.
      addon.tab.redux.dispatch({ type: "scratch-paint/color-index/CHANGE_COLOR_INDEX", index: colorIndex });
    };

    // Click p0 to colour-pick the first stop; reflects change (including alpha) via Redux.
    p0Handle.g.addEventListener("click", (e) => {
      if (addon.self.disabled || attachDragMoved) return;
      e.stopPropagation();
      openColorPicker(
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
        e.clientY,
        p0Handle.g,
        11
      );
    });

    // Click p1 to colour-pick the last stop; reflects change (including alpha) via Redux.
    p1Handle.g.addEventListener("click", (e) => {
      if (addon.self.disabled || attachDragMoved) return;
      e.stopPropagation();
      openColorPicker(
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
        e.clientY,
        p1Handle.g,
        11
      );
    });

    // ── Extra stop handle pool ────────────────────────────────────────────
    // Smaller handles (r=5 circle, r=7 shadow) sit between p0 and p1 on the axis.
    // Pool grows as needed; excess handles are hidden when extraStops shrinks.
    const extraHandlePool = [];

    const makeExtraStopHandle = (poolIndex) => {
      const g = document.createElementNS(NS, "g");
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
              document.querySelector(".sa-extra-stop-picker")?._close?.();
            }
            extraStops.splice(poolIndex, 1);
            applyAllStops();
            syncOverlay();
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
    const setPickerHighlight = (group, ringRadius) => {
      activePickerGroup = group ?? null;
      if (!group) {
        pickerRingWhite.style.display = "none";
        pickerRingBlack.style.display = "none";
        return;
      }
      const tf = group.getAttribute("transform") ?? "";
      // White ring peeks outside the black ring; black ring is at the specified radius.
      for (const [ring, r] of [
        [pickerRingWhite, ringRadius + 2.5],
        [pickerRingBlack, ringRadius],
      ]) {
        ring.setAttribute("r", r);
        ring.setAttribute("transform", tf);
        ring.style.display = "";
      }
    };

    // Generic inline HSV + alpha colour picker.
    // openColorPicker(initialCss, onCommit, clientX, clientY, handleGroup?, ringRadius?)
    //   initialCss    — starting colour as any CSS string
    //   onCommit(css) — called live on every change with the new CSS colour string
    //   handleGroup   — SVG <g> handle group to highlight while picker is open (optional)
    //   ringRadius    — ring radius in SVG units (default 11 for p0/p1 handles)
    // openExtraColorPicker(idx, …) is a thin wrapper around this for extra stops.
    const openColorPicker = (initialCss, onCommit, clientX, clientY, handleGroup = null, ringRadius = 11) => {
      // Reuse existing picker if open: swap colour and callback without rebuilding.
      // Reposition only if the user has NOT manually dragged the panel since it last opened.
      const existing = document.querySelector(".sa-extra-stop-picker");
      if (existing?._setColor) {
        existing._setOnCommit(onCommit);
        existing._setColor(initialCss);
        setPickerHighlight(handleGroup, ringRadius);
        if (!existing._wasMoved) {
          existing.style.left = `${clamp(clientX - 10, 4, window.innerWidth - existing.offsetWidth - 4)}px`;
          existing.style.top = `${clamp(clientY + 28, 4, window.innerHeight - existing.offsetHeight - 4)}px`;
        }
        return;
      }
      existing?.remove();
      setPickerHighlight(handleGroup, ringRadius);

      // ── Colour math ──────────────────────────────────────────────────────
      const rgbToHsv = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
          min = Math.min(r, g, b),
          d = max - min;
        let h = 0;
        if (d) {
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        return [h * 360, max === 0 ? 0 : (d / max) * 100, max * 100];
      };
      const hsvToRgb = (h, s, v) => {
        h /= 360;
        s /= 100;
        v /= 100;
        const i = Math.floor(h * 6),
          f = h * 6 - i;
        const p = v * (1 - s),
          q = v * (1 - f * s),
          t = v * (1 - (1 - f) * s);
        return [
          [v, t, p],
          [q, v, p],
          [p, v, t],
          [p, q, v],
          [t, p, v],
          [v, p, q],
        ][i % 6].map((c) => Math.round(c * 255));
      };
      const h2 = (v) =>
        Math.round(clamp(v, 0, 255))
          .toString(16)
          .padStart(2, "0");

      const p0 = parseColor(initialCss) ?? [128, 128, 128, 1];
      const initHsv = rgbToHsv(p0[0], p0[1], p0[2]);
      let H = initHsv[0],
        S = initHsv[1],
        V = initHsv[2],
        A = (p0[3] ?? 1) * 100;

      const getCss = () => {
        const [r, g, b] = hsvToRgb(H, S, V);
        const a = +(A / 100).toFixed(3);
        return a >= 0.999 ? `#${h2(r)}${h2(g)}${h2(b)}` : `rgba(${r},${g},${b},${a})`;
      };
      let activeOnCommit = onCommit;
      const commit = () => activeOnCommit(getCss());

      // ── Panel shell ──────────────────────────────────────────────────────
      const CW = 200;
      const panel = document.createElement("div");
      panel.className = "sa-extra-stop-picker";
      panel.style.cssText =
        `position:fixed;background:#1e1e1e;border:1px solid #555;border-radius:7px;` +
        `padding:10px;z-index:99999;box-shadow:0 6px 28px rgba(0,0,0,0.85);user-select:none;` +
        `width:${CW}px;box-sizing:content-box;overflow:hidden;`;
      panel.addEventListener("mousedown", (e) => e.stopPropagation());

      // ── Drag handle (title bar) ──────────────────────────────────────────
      const dragHandle = document.createElement("div");
      dragHandle.style.cssText =
        "margin:-10px -10px 10px;padding:5px 0;background:#2d2d2d;" +
        "display:flex;align-items:center;justify-content:center;cursor:grab;flex-shrink:0;";
      const gripDots = document.createElement("div");
      gripDots.style.cssText = "display:grid;grid-template-columns:repeat(3,4px);gap:3px;opacity:0.45;";
      for (let gi = 0; gi < 6; gi++) {
        const dot = document.createElement("div");
        dot.style.cssText = "width:3px;height:3px;border-radius:50%;background:white;";
        gripDots.appendChild(dot);
      }
      dragHandle.appendChild(gripDots);
      dragHandle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        const startX = e.clientX,
          startY = e.clientY;
        const origLeft = parseInt(panel.style.left, 10) || 0;
        const origTop = parseInt(panel.style.top, 10) || 0;
        dragHandle.style.cursor = "grabbing";
        const mv = (ev) => {
          panel._wasMoved = true;
          panel.style.left = `${clamp(origLeft + ev.clientX - startX, 0, window.innerWidth - panel.offsetWidth)}px`;
          panel.style.top = `${clamp(origTop + ev.clientY - startY, 0, window.innerHeight - panel.offsetHeight)}px`;
        };
        const up = () => {
          document.removeEventListener("mousemove", mv);
          document.removeEventListener("mouseup", up);
          dragHandle.style.cursor = "grab";
        };
        document.addEventListener("mousemove", mv);
        document.addEventListener("mouseup", up);
      });

      // Drag helper: attaches mousedown → mousemove/mouseup on document.
      const makeDragTarget = (el, onMove, onUp) => {
        el.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          onMove(e);
          const mv = (ev) => {
            ev.preventDefault();
            onMove(ev);
          };
          const up = () => {
            document.removeEventListener("mousemove", mv);
            document.removeEventListener("mouseup", up);
            onUp?.();
          };
          document.addEventListener("mousemove", mv);
          document.addEventListener("mouseup", up);
        });
      };

      // ── SV canvas ────────────────────────────────────────────────────────
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const SV_H = 110;
      const svCanvas = document.createElement("canvas");
      svCanvas.width = CW * DPR;
      svCanvas.height = SV_H * DPR;
      svCanvas.style.cssText = `width:${CW}px;height:${SV_H}px;border-radius:4px;cursor:crosshair;display:block;`;

      const drawSV = () => {
        const ctx = svCanvas.getContext("2d");
        const w = svCanvas.width,
          ch = svCanvas.height;
        ctx.fillStyle = `hsl(${H},100%,50%)`;
        ctx.fillRect(0, 0, w, ch);
        const wg = ctx.createLinearGradient(0, 0, w, 0);
        wg.addColorStop(0, "rgba(255,255,255,1)");
        wg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = wg;
        ctx.fillRect(0, 0, w, ch);
        const bk = ctx.createLinearGradient(0, 0, 0, ch);
        bk.addColorStop(0, "rgba(0,0,0,0)");
        bk.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = bk;
        ctx.fillRect(0, 0, w, ch);
        const cx = (S / 100) * w,
          cy = (1 - V / 100) * ch;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * DPR, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 * DPR;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 5 * DPR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1 * DPR;
        ctx.stroke();
      };
      makeDragTarget(
        svCanvas,
        (e) => {
          const r = svCanvas.getBoundingClientRect();
          S = clamp((e.clientX - r.left) / r.width, 0, 1) * 100;
          V = clamp(1 - (e.clientY - r.top) / r.height, 0, 1) * 100;
          drawSV();
          syncPickers();
          commit();
        },
        () => triggerUndo()
      );

      // ── Shared bar factory (hue + alpha) ─────────────────────────────────
      // The knob overhangs the track by its radius (9px) on each end, so extend the
      // outer hit-target by KNOB_R on each side using negative margins (same pattern as
      // the drag-handle title bar).  Track is inset by the same amount so it stays at CW wide.
      const KNOB_R = 9;
      const TRACK_W = CW - 2 * KNOB_R; // track narrower than panel so knob stays within panel bounds
      const makeBar = (marginTop) => {
        const outer = document.createElement("div");
        outer.style.cssText = `position:relative;margin-top:${marginTop}px;margin-left:-${KNOB_R}px;margin-right:-${KNOB_R}px;height:18px;cursor:crosshair;`;
        const track = document.createElement("div");
        track.style.cssText = `position:absolute;top:3px;left:${2 * KNOB_R}px;right:${2 * KNOB_R}px;height:12px;border-radius:6px;pointer-events:none;`;
        const thumb = document.createElement("div");
        thumb.style.cssText =
          "position:absolute;top:0;width:18px;height:18px;border-radius:50%;background:white;" +
          "box-shadow:0 0 0 2px rgba(0,0,0,0.45),0 1px 4px rgba(0,0,0,0.6);transform:translateX(-50%);pointer-events:none;";
        outer.append(track, thumb);
        return { outer, track, thumb };
      };

      // ── Hue bar ──────────────────────────────────────────────────────────
      const { outer: hueOuter, track: hueTrack, thumb: hueThumb } = makeBar(8);
      hueTrack.style.background =
        "linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%)," +
        "hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))";
      makeDragTarget(
        hueOuter,
        (e) => {
          const r = hueOuter.getBoundingClientRect();
          H = clamp((e.clientX - r.left - 2 * KNOB_R) / TRACK_W, 0, 1) * 360;
          drawSV();
          syncPickers();
          commit();
        },
        () => triggerUndo()
      );

      // ── Alpha bar ────────────────────────────────────────────────────────
      const { outer: alphaOuter, track: alphaTrack, thumb: alphaThumb } = makeBar(6);
      const CHECKER =
        "linear-gradient(45deg,#888 25%,transparent 25%),linear-gradient(-45deg,#888 25%,transparent 25%)," +
        "linear-gradient(45deg,transparent 75%,#888 75%),linear-gradient(-45deg,transparent 75%,#888 75%)";
      Object.assign(alphaTrack.style, {
        backgroundImage: CHECKER,
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0,0 4px,4px -4px,-4px 0",
        backgroundColor: "#ccc",
      });
      const alphaFill = document.createElement("div");
      alphaFill.style.cssText = "position:absolute;inset:0;border-radius:6px;pointer-events:none;";
      alphaTrack.appendChild(alphaFill);

      const updateAlphaBar = () => {
        const [r, g, b] = hsvToRgb(H, S, V);
        alphaFill.style.background = `linear-gradient(to right,rgba(${r},${g},${b},0),rgb(${r},${g},${b}))`;
        alphaThumb.style.left = `${2 * KNOB_R + (A / 100) * TRACK_W}px`;
      };
      makeDragTarget(
        alphaOuter,
        (e) => {
          const r = alphaOuter.getBoundingClientRect();
          A = clamp((e.clientX - r.left - 2 * KNOB_R) / TRACK_W, 0, 1) * 100;
          syncPickers();
          commit();
        },
        () => triggerUndo()
      );

      // ── Bottom row (preview swatch + hex + alpha %) ───────────────────────
      const bottomRow = document.createElement("div");
      bottomRow.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:8px;";

      const swatchWrap = document.createElement("div");
      swatchWrap.style.cssText =
        `width:22px;height:22px;border-radius:3px;border:1px solid #555;flex-shrink:0;` +
        `background-image:${CHECKER};background-size:8px 8px;background-position:0 0,0 4px,4px -4px,-4px 0;background-color:#ccc;`;
      const swatchFill = document.createElement("div");
      swatchFill.style.cssText = "width:100%;height:100%;border-radius:2px;";
      swatchWrap.appendChild(swatchFill);

      const hexInp = document.createElement("input");
      hexInp.type = "text";
      hexInp.maxLength = 7;
      hexInp.style.cssText =
        "flex:1;min-width:0;background:#111;color:white;border:1px solid #444;border-radius:3px;" +
        "padding:3px 5px;font-family:monospace;font-size:12px;outline:none;box-sizing:border-box;";
      hexInp.addEventListener("mousedown", (e) => e.stopPropagation());

      const aLabel = document.createElement("span");
      aLabel.textContent = "A:";
      aLabel.style.cssText = "color:#888;font-size:11px;font-family:sans-serif;flex-shrink:0;";

      const alphaInp = document.createElement("input");
      alphaInp.type = "text";
      alphaInp.style.cssText =
        "width:42px;background:#111;color:white;border:1px solid #444;border-radius:3px;" +
        "padding:3px 4px;font-size:11px;text-align:right;outline:none;box-sizing:border-box;flex-shrink:0;";
      alphaInp.addEventListener("mousedown", (e) => e.stopPropagation());

      // ── Eyedropper button ────────────────────────────────────────────────
      // Hooks into Scratch's own EyeDropperTool via Redux — no pixel-sampling code needed.
      const eyeDropperBtn = document.createElement("button");
      eyeDropperBtn.title = msg("pick-color");
      eyeDropperBtn.style.cssText =
        "width:22px;height:22px;padding:0;border:1px solid #555;border-radius:3px;background:#2a2a2a;" +
        "cursor:crosshair;display:flex;align-items:center;justify-content:center;flex-shrink:0;";
      eyeDropperBtn.innerHTML =
        `<svg width="14" height="14" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">` +
        `<path fill="white" d="M9.153 12.482c-.12.136-.274.222-.546.29-.7.154-1.365.784-1.57 1.483-.068.22-.29.459-.529.579L4.735 15.67c-.085.034-.154.052-.188.052l-.273-.256c0-.017 0-.085.051-.205l.836-1.79c.103-.22.342-.443.581-.511.7-.22 1.331-.869 1.518-1.721.034-.136.12-.272.24-.41L11.44 6.908l1.654 1.654-3.94 3.92zM16.608 5.289c.256-.256.392-.614.392-.955s-.136-.683-.392-.938c-.529-.529-1.365-.529-1.893 0l-1.484 1.483-.171-.171-.546-.545c-.341-.34-.904-.34-1.245 0l-.665.648c-.324.34-.341.835-.051 1.176L6.595 9.925c-.29.307-.494.665-.614 1.176-.051.256-.341.546-.614.631-.562.17-1.108.648-1.364 1.21l-.835 1.773c-.273.597-.205 1.21.17 1.603l.342.34c.222.222.529.341.87.341.222 0 .477-.068.716-.17l1.791-.836c.563-.272 1.041-.801 1.211-1.364.069-.272.376-.562.785-.648.359-.085.717-.29 1.007-.596l3.957-3.932c.341.29.853.256 1.16-.068l.665-.648c.341-.341.341-.904 0-1.245l-.58-.58-.136-.136 1.484-1.484z"/>` +
        `</svg>`;
      eyeDropperBtn.addEventListener("mousedown", (e) => e.stopPropagation());
      eyeDropperBtn.addEventListener("click", () => {
        // Fade the panel so user can see the canvas, but keep it in the DOM.
        panel.style.opacity = "0.15";
        panel.style.pointerEvents = "none";
        addon.tab.redux.dispatch({
          type: "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER",
          callback: (hexString) => {
            const c = parseColor(hexString);
            if (c) {
              [H, S, V] = rgbToHsv(c[0], c[1], c[2]);
              // Eyedropper samples rendered canvas pixels — always opaque. Leave A unchanged.
            }
            drawSV();
            syncPickers();
            commit();
            triggerUndo();
          },
          previousMode: cachedPaper?.tool ?? null,
        });
        // Restore panel after any mouseup (pick or cancel — both end the dropper session).
        document.addEventListener(
          "mouseup",
          () => {
            panel.style.opacity = "";
            panel.style.pointerEvents = "";
          },
          { once: true, capture: true }
        );
      });

      bottomRow.append(swatchWrap, hexInp, aLabel, alphaInp, eyeDropperBtn);

      // syncPickers: push current H/S/V/A into all UI widgets.
      const syncPickers = () => {
        const [r, g, b] = hsvToRgb(H, S, V);
        hexInp.value = `#${h2(r)}${h2(g)}${h2(b)}`;
        alphaInp.value = `${Math.round(A)}%`;
        hueThumb.style.left = `${2 * KNOB_R + (H / 360) * TRACK_W}px`;
        updateAlphaBar();
        swatchFill.style.background = getCss();
      };

      hexInp.addEventListener("change", () => {
        const c = parseColor(hexInp.value.trim());
        if (c) {
          [H, S, V] = rgbToHsv(c[0], c[1], c[2]);
          drawSV();
          syncPickers();
          commit();
          triggerUndo();
        }
      });
      hexInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") hexInp.dispatchEvent(new Event("change"));
      });

      alphaInp.addEventListener("change", () => {
        const v = parseFloat(alphaInp.value);
        if (!isNaN(v)) {
          A = clamp(v, 0, 100);
          syncPickers();
          commit();
          triggerUndo();
        }
      });
      alphaInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") alphaInp.dispatchEvent(new Event("change"));
      });

      // ── Assemble ─────────────────────────────────────────────────────────
      panel.append(dragHandle, svCanvas, hueOuter, alphaOuter, bottomRow);
      document.body.appendChild(panel);
      drawSV();
      syncPickers();

      // Expose updaters so openColorPicker can reuse this panel for a different stop.
      panel._setOnCommit = (fn) => {
        activeOnCommit = fn;
      };
      panel._setColor = (css) => {
        const c = parseColor(css) ?? [128, 128, 128, 1];
        [H, S, V] = rgbToHsv(c[0], c[1], c[2]);
        A = (c[3] ?? 1) * 100;
        drawSV();
        syncPickers();
      };
      // Programmatic close used when the active node is deleted.
      panel._close = () => {
        setPickerHighlight(null);
        panel.remove();
        document.removeEventListener("mousedown", closeOnOutside, true);
      };

      // Position below + right of cursor, clamped inside viewport.
      const pr = panel.getBoundingClientRect();
      panel.style.left = `${clamp(clientX - 10, 4, window.innerWidth - CW - 24)}px`;
      panel.style.top = `${clamp(clientY + 28, 4, window.innerHeight - pr.height - 4)}px`;

      // Non-modal close: capture-phase listener on every mousedown.
      // · Click inside the picker panel  → return, picker interaction works normally.
      // · Click on a gradient handle (.sa-grad-overlay) → do NOT remove the panel; let the
      //   event through so the handle's click handler calls openColorPicker, which will find
      //   this panel via _setColor and swap the colour without rebuilding or repositioning.
      // · Click on empty space → stopPropagation (keep fill popup open) + remove panel.
      const closeOnOutside = (e) => {
        // While Scratch's eyedropper is active, don't close or stop the mousedown —
        // stopping propagation here prevents paper.js from receiving the event, which
        // keeps hideLoupe=true and causes the dropper callback to be skipped entirely.
        if (addon.tab.redux.state?.scratchPaint?.color?.eyeDropper?.active) return;
        if (panel.contains(e.target)) return;
        const overlay = document.querySelector(".sa-grad-overlay");
        if (overlay?.contains(e.target)) return; // handle click — let event through, keep panel
        e.stopPropagation();
        setPickerHighlight(null);
        panel.remove();
        document.removeEventListener("mousedown", closeOnOutside, true);
      };
      setTimeout(() => document.addEventListener("mousedown", closeOnOutside, true), 150);
    };

    // Thin wrapper: open colour picker for an extra (middle) stop.
    const openExtraColorPicker = (idx, clientX, clientY, groupEl = null) => {
      if (!extraStops[idx]) return;
      openColorPicker(
        extraStops[idx].color,
        (css) => {
          if (extraStops[idx]) {
            extraStops[idx].color = css;
            applyAllStops();
            syncOverlay();
          }
        },
        clientX,
        clientY,
        groupEl,
        9
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
      const newStop = { color: blended, offset: clamp(t, stops.p0 + 0.01, stops.p1 - 0.01) };
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
      destroy: () => {
        active = false;
        svg.remove();
      },
    };
  };

  // ── Main loop ──────────────────────────────────────────────────────────────────
  addon.self.addEventListener("disabled", () => {
    activeOverlay?.destroy();
    activeOverlay = null;
  });

  while (true) {
    const swatchesRow = await addon.tab.waitForElement('[class*="color-picker_gradient-swatches-row"]', {
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
    if (spModals?.fillColor && spColor?.fillColor?.gradientType && spColor.fillColor.gradientType !== "SOLID") {
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
    stops = readCurrentStops(paper);
    storedAngle = colorStateNow.gradientType === "VERTICAL" ? 90 : readCurrentAngle(paper);

    let needsReapply = false;
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
      needsReapply = true;
    } else {
      lastKnownGradientType = colorStateNow.gradientType;
    }

    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container']");
    const overlayCanvas = canvasContainer?.querySelector("canvas");
    if (canvasContainer && overlayCanvas) {
      activeOverlay = buildOverlay(paper, canvasContainer, overlayCanvas);
    }

    if (needsReapply) applyAllStops();

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
