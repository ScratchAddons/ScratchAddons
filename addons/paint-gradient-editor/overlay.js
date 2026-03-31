// Canvas SVG overlay for the gradient stop editor.
// Draggable handles sitting on top of the paper.js canvas.
// mousedown calls stopPropagation so react-popover doesn't close the fill picker.
//
// ctx shape (getter/setter proxied from userscript.js closure):
//   stops, extraStops, c0hex, c1hex, c0css, c1css, storedAngle,
//   activeColorMode, cachedPaper, addon, msg,
//   colorProp(), applyAllStops(), triggerUndo(), readCurrentAngle(paper),
//   withCollapsedOuterStops(items, cb), dispatchSelectedItems(items)

import { clamp, colorToCss, parseColor, ensureHex } from "./color-utils.js";
import StopColorPicker from "./stop-color-picker.js";

export function buildOverlay(paper, canvasContainer, canvas, ctx) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "sa-grad-overlay");
  svg.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:10";
  ctx.addon.tab.displayNoneWhileDisabled(svg);
  const overlayPaper = "var(--sa-grad-overlay-paper)";
  const overlayInk = "var(--sa-grad-overlay-ink)";
  const overlayShadow = "var(--sa-grad-overlay-shadow)";

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
  // Two theme-aware layers preserve contrast against the artwork and editor chrome.
  const axisOutline = svgEl("line", { stroke: overlayInk, "stroke-width": 4, "stroke-opacity": 0.5 });
  svg.appendChild(axisOutline);
  const axisLine = svgEl("line", { stroke: overlayPaper, "stroke-width": 2 });
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
    stroke: overlayPaper,
    "stroke-width": 2,
    "pointer-events": "none",
  });
  pickerRingWhite.style.display = "none";
  const pickerRingBlack = svgEl("circle", {
    fill: "none",
    stroke: overlayInk,
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
      svgEl("circle", { r: 8, fill: overlayShadow }),
      svgEl("circle", { r: 6, fill: "transparent", stroke: overlayPaper, "stroke-width": 2 })
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
    const circle = svgEl("circle", { r: 7, stroke: overlayPaper, "stroke-width": 2 });
    g.append(svgEl("circle", { r: 9, fill: overlayShadow }), circle);
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
  // Radial mode counts the movable p0 handle as the first "inner" handle; linear mode does not.
  const axisInnerCount = (isRadial, extraCount = ctx.extraStops.length) => (isRadial ? extraCount + 1 : extraCount);
  const extraInnerIdx = (isRadial, extraIdx) => (isRadial ? extraIdx + 1 : extraIdx);
  const displayedOffset = (innerIdx, innerCount, offset, axisLenPx) =>
    crampedFrac(innerIdx, innerCount, offset, axisLenPx) ?? offset;
  const logicalOffset = (innerIdx, innerCount, rawFrac, axisLenPx) =>
    crampedToOffset(innerIdx, innerCount, rawFrac, axisLenPx);
  const extraStopBounds = (isRadial, idx) => ({
    left: idx === 0 ? (isRadial ? ctx.stops.p0 : 0) : ctx.extraStops[idx - 1].offset,
    right: idx === ctx.extraStops.length - 1 ? ctx.stops.p1 : ctx.extraStops[idx + 1].offset,
  });

  const syncOverlay = () => {
    const spModals = ctx.addon.tab.redux.state?.scratchPaint?.modals;
    const modalForMode = ctx.activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
    if (!modalForMode || ctx.addon.self.disabled) {
      svg.style.display = "none";
      return;
    }
    const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
    const fc = items[0]?.[ctx.colorProp()];
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
      const innerCount = axisInnerCount(true);
      // Centre handle at origin; p0/p1 slide along radius with p0 offset from centre.
      moveTo(centreHandle, op.x, op.y);
      centreHandle.style.display = "";

      // Cramp p0 so it never visually overlaps the centre or the next handle.
      const p0Frac = displayedOffset(0, innerCount, ctx.stops.p0, axisLenPx);
      moveTo(p0Handle.g, lerp(op.x, dp.x, p0Frac), lerp(op.y, dp.y, p0Frac));
      // p1 sits at the destination point — the end of the visible gradient line
      moveTo(p1Handle.g, dp.x, dp.y);
    } else {
      // Linear: p0 handle sits at origin, p1 handle sits at destination (dual-function).
      centreHandle.style.display = "none";
      moveTo(p0Handle.g, op.x, op.y);
      moveTo(p1Handle.g, dp.x, dp.y);
    }

    p0Handle.circle.setAttribute("fill", ctx.c0hex);
    p1Handle.circle.setAttribute("fill", ctx.c1hex);

    // Sync extra stop handles — grow pool as needed, hide unused entries.
    // innerCount: for radial, p0 plus extras are all inner handles; for linear, only extras.
    const innerCount = axisInnerCount(isRadial);
    for (let i = 0; i < ctx.extraStops.length; i++) {
      if (i >= extraHandlePool.length) extraHandlePool.push(makeExtraStopHandle(i));
      const h = extraHandlePool[i];
      const innerIdx = extraInnerIdx(isRadial, i);
      const t = displayedOffset(innerIdx, innerCount, ctx.extraStops[i].offset, axisLenPx);
      const sp = { x: lerp(op.x, dp.x, t), y: lerp(op.y, dp.y, t) };
      moveTo(h.g, sp.x, sp.y);
      h.circle.setAttribute("fill", ctx.extraStops[i].color);
      // Only clear visibility if this handle is not currently being dragged off-axis.
      if (h.g !== pendingDeleteHandle) h.g.style.visibility = "";
      h.g.style.display = "";
    }
    for (let i = ctx.extraStops.length; i < extraHandlePool.length; i++) {
      const h = extraHandlePool[i];
      // If a hidden handle had the ring, clear it so the floating ring disappears.
      if (activePickerGroup === h.g) setPickerHighlight(null);
      h.g.style.display = "none";
    }
    // Keep the floating rings in sync as handles are repositioned.
    if (activePickerGroup) {
      const tf = activePickerGroup.getAttribute("transform");
      for (const ring of [pickerRingWhite, pickerRingBlack]) {
        if (tf) ring.setAttribute("transform", tf);
        else ring.removeAttribute("transform");
      }
    }
  };

  // Set to true by attachDrag whenever the mouse moves during a drag.
  // Extra-stop click handlers read this to suppress the click event after drag.
  let attachDragMoved = false;

  const attachDrag = (handleEl, defaultCursor, onMove, onUp) => {
    handleEl.addEventListener("mousedown", (e) => {
      if (ctx.addon.self.disabled) return;
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
        else ctx.triggerUndo();
      };
      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", upHandler);
    });
  };

  const selectedLayers = () => paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);

  // Centre handle (radial only): shift origin + destination together, preserving radius.
  attachDrag(centreHandle, "pointer", (projected) => {
    const cp = ctx.colorProp();
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
    const cp = ctx.colorProp();
    const fc = selectedLayers()[0]?.[cp];
    if (!fc?.gradient) return;
    if (fc.gradient.radial) {
      const op = toSVG(fc.origin);
      const dp = toSVG(fc.destination);
      const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
      const rawFrac = projectOntoAxis(projected, fc.origin, fc.destination);
      const maxP0 = ctx.extraStops.length > 0 ? ctx.extraStops[0].offset : 1;
      ctx.stops.p0 = clamp(logicalOffset(0, axisInnerCount(true), rawFrac, axisLenPx), 0, maxP0);
      ctx.applyAllStops();
    } else {
      for (const item of selectedLayers()) {
        const fc = item[cp];
        if (!fc?.gradient || fc.gradient.radial) continue;
        item[cp].origin = projected;
      }
      ctx.storedAngle = ctx.readCurrentAngle(ctx.cachedPaper);
    }
  });

  // p1 handle:
  //   Linear — free drag repositions fc.destination (the handle IS the axis end).
  //   Radial  — free drag repositions fc.destination (the end of the gradient line).
  attachDrag(p1Handle.g, "pointer", (projected) => {
    const cp = ctx.colorProp();
    for (const item of selectedLayers()) {
      const fc = item[cp];
      if (!fc?.gradient) continue;
      item[cp].destination = projected;
      if (!fc.gradient.radial) ctx.storedAngle = ctx.readCurrentAngle(ctx.cachedPaper);
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
    ctx.withCollapsedOuterStops(items, () => ctx.dispatchSelectedItems(items));
    // Trigger the opacity-slider addon to re-read Redux and update its handle position.
    ctx.addon.tab.redux.dispatch({ type: "scratch-paint/color-index/CHANGE_COLOR_INDEX", index: colorIndex });
  };

  // Click p0 to colour-pick the first stop; reflects change (including alpha) via Redux.
  p0Handle.g.addEventListener("click", (e) => {
    if (ctx.addon.self.disabled || attachDragMoved) return;
    e.stopPropagation();
    setPickerHighlight(p0Handle.g);
    picker.open(
      ctx.c0css,
      (css) => {
        ctx.c0css = css;
        ctx.c0hex = ensureHex(css);
        const cp = ctx.colorProp();
        for (const item of selectedLayers()) {
          const g = item[cp]?.gradient;
          if (g?.stops?.length >= 1) g.stops[0].color = new paper.Color(css);
        }
        ctx.applyAllStops();
        syncOverlay();
        syncPickerColorToRedux(0);
      },
      e.clientX,
      e.clientY
    );
  });

  // Click p1 to colour-pick the last stop; reflects change (including alpha) via Redux.
  p1Handle.g.addEventListener("click", (e) => {
    if (ctx.addon.self.disabled || attachDragMoved) return;
    e.stopPropagation();
    setPickerHighlight(p1Handle.g);
    picker.open(
      ctx.c1css,
      (css) => {
        ctx.c1css = css;
        ctx.c1hex = ensureHex(css);
        const cp = ctx.colorProp();
        for (const item of selectedLayers()) {
          const g = item[cp]?.gradient;
          if (g?.stops?.length >= 2) g.stops[g.stops.length - 1].color = new paper.Color(css);
        }
        ctx.applyAllStops();
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
    const previewExtra = ctx.extraStops.filter((_, i) => i !== idx);
    const cp = ctx.colorProp();
    for (const item of selectedLayers()) {
      if (!item[cp]?.gradient) continue;
      const liveStops = item[cp].gradient.stops;
      const c0 = liveStops[0].color;
      const c1 = liveStops[liveStops.length - 1].color;
      item[cp].gradient = { stops: [c0, ...previewExtra.map((s) => s.color), c1], radial: item[cp].gradient.radial };
      const g2 = item[cp].gradient;
      g2.stops[0].offset = ctx.stops.p0;
      for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
      g2.stops[g2.stops.length - 1].offset = ctx.stops.p1;
    }
    ctx.extraStops.splice(idx, 1);
    ctx.applyAllStops();
    syncOverlay();
  };

  const makeExtraStopHandle = (poolIndex) => {
    const g = document.createElementNS(NS, "g");
    g._ringR = 9;
    g.style.cssText = "pointer-events:all;cursor:pointer";
    const circle = svgEl("circle", { r: 5, stroke: overlayPaper, "stroke-width": 1.5 });
    g.append(svgEl("circle", { r: 7, fill: overlayShadow }), circle);
    // Insert before the floating rings so the rings always stay on top.
    svg.insertBefore(g, pickerRingWhite);

    // Colour pick on handle click — only if the mouse didn't move (not a drag).
    g.addEventListener("click", (e) => {
      if (ctx.addon.self.disabled) return;
      if (attachDragMoved) return;
      e.stopPropagation();
      openExtraColorPicker(poolIndex, e.clientX, e.clientY, g);
    });

    // Double-click deletes this stop.
    g.addEventListener("dblclick", (e) => {
      if (ctx.addon.self.disabled || attachDragMoved) return;
      e.stopPropagation();
      picker.close();
      removeExtraStop(poolIndex);
      ctx.triggerUndo();
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
        const fc = selectedLayers()[0]?.[ctx.colorProp()];
        if (!fc?.gradient || !ctx.extraStops[idx]) return;
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
          const previewExtra = ctx.extraStops.filter((_, i) => i !== poolIndex);
          const item = selectedLayers()[0];
          const cp = ctx.colorProp();
          if (item?.[cp]?.gradient) {
            const liveStops = item[cp].gradient.stops;
            const liveC0 = liveStops[0].color;
            const liveC1 = liveStops[liveStops.length - 1].color;
            item[cp].gradient = {
              stops: [liveC0, ...previewExtra.map((s) => s.color), liveC1],
              radial: item[cp].gradient.radial,
            };
            const g2 = item[cp].gradient;
            g2.stops[0].offset = ctx.stops.p0;
            for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
            g2.stops[g2.stops.length - 1].offset = ctx.stops.p1;
          }
        } else {
          g.style.visibility = "";
          circle.setAttribute("fill", ctx.extraStops[idx].color);
          const rawFrac = projectOntoAxis(projected, A, B);
          const opSVG = toSVG(A),
            dpSVG = toSVG(B);
          const lenPx = Math.hypot(dpSVG.x - opSVG.x, dpSVG.y - opSVG.y);
          const isRad = fc.gradient.radial;
          const innerIdx = extraInnerIdx(isRad, idx);
          const innerCount = axisInnerCount(isRad);
          const { left: leftBound, right: rightBound } = extraStopBounds(isRad, idx);
          ctx.extraStops[idx].offset = clamp(
            logicalOffset(innerIdx, innerCount, rawFrac, lenPx),
            leftBound,
            rightBound
          );
          ctx.applyAllStops();
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
          circle.setAttribute("fill", ctx.extraStops[poolIndex].color);
        }
        ctx.triggerUndo();
      }
    );

    return { g, circle };
  };

  // Handle currently being dragged off-axis (pending-delete); syncOverlay skips its visibility reset.
  let pendingDeleteHandle = null;
  // Track which handle group currently has the picker open.
  let activePickerGroup = null;
  const setPickerHighlight = (group) => {
    activePickerGroup = group;
    if (!group) {
      pickerRingWhite.style.display = "none";
      pickerRingBlack.style.display = "none";
      return;
    }
    const ringR = group._ringR;
    const tf = group.getAttribute("transform");
    // White ring peeks outside the black ring; black ring is at the specified radius.
    for (const [ring, r] of [
      [pickerRingWhite, ringR + 2.5],
      [pickerRingBlack, ringR],
    ]) {
      ring.setAttribute("r", r);
      if (tf) ring.setAttribute("transform", tf);
      else ring.removeAttribute("transform");
      ring.style.display = "";
    }
  };

  const picker = new StopColorPicker({
    msg: ctx.msg,
    redux: ctx.addon.tab.redux,
    triggerUndo: ctx.triggerUndo,
    getCachedPaper: () => ctx.cachedPaper,
    onClose: () => setPickerHighlight(null),
  });
  const openExtraColorPicker = (idx, clientX, clientY, groupEl = null) => {
    if (!ctx.extraStops[idx]) return;
    setPickerHighlight(groupEl);
    picker.open(
      ctx.extraStops[idx].color,
      (color) => {
        if (ctx.extraStops[idx]) {
          ctx.extraStops[idx].color = color;
          ctx.applyAllStops();
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
    if (ctx.addon.self.disabled) return;
    e.stopPropagation();
    // Ignore if the mouse moved more than 4px — treat as a drag, not a click.
    if (
      axisMouseDownPos &&
      (Math.abs(e.clientX - axisMouseDownPos.x) > 4 || Math.abs(e.clientY - axisMouseDownPos.y) > 4)
    )
      return;
    const fc = selectedLayers()[0]?.[ctx.colorProp()];
    if (!fc?.gradient) return;
    const projected = toProject(e.clientX, e.clientY);
    const t = projectOntoAxis(projected, fc.origin, fc.destination);
    // Interpolate colour (+ alpha) between the two adjacent stops.
    // Use live paper.js stop colours so outer-stop alpha is included.
    const liveStops = fc.gradient.stops;
    const allStops = [
      { color: colorToCss(liveStops[0].color), offset: ctx.stops.p0 },
      ...ctx.extraStops,
      { color: colorToCss(liveStops[liveStops.length - 1].color), offset: ctx.stops.p1 },
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
    if (isRadial && t < ctx.stops.p0) {
      ctx.extraStops.unshift({ color: ctx.c0css, offset: ctx.stops.p0 });
      ctx.stops.p0 = clamp(logicalOffset(0, axisInnerCount(true), t, axisLenPx), 0, ctx.stops.p0 - 0.01);
      ctx.applyAllStops();
      syncOverlay();
      ctx.triggerUndo();
      attachDragMoved = false;
      p0Handle.g.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: e.clientX, clientY: e.clientY }));
      return;
    }
    const newInnerIdx = ctx.extraStops.filter((s) => s.offset < t).length;
    const newExtraCount = ctx.extraStops.length + 1;
    const newInnerCount = axisInnerCount(isRadial, newExtraCount);
    const innerIdxForNew = extraInnerIdx(isRadial, newInnerIdx);
    const offset = logicalOffset(innerIdxForNew, newInnerCount, t, axisLenPx);
    const newStop = { color: blended, offset: clamp(offset, ctx.stops.p0 + 0.01, ctx.stops.p1 - 0.01) };
    ctx.extraStops.push(newStop);
    ctx.extraStops.sort((a, b) => a.offset - b.offset);
    ctx.applyAllStops();
    syncOverlay(); // grows pool so the new handle exists
    const newIdx = ctx.extraStops.indexOf(newStop);
    // syncOverlay() above has grown the pool, so the handle group exists.
    openExtraColorPicker(newIdx, e.clientX, e.clientY, extraHandlePool[newIdx]?.g);
    ctx.triggerUndo();
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
}
