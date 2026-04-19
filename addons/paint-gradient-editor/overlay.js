import StopColorPicker from "./stop-color-picker.js";
import { clamp, colorToHex, colorToCss, parseColor, ensureHex } from "./color-utils.js";
import { STOP_D, makeCoordHelpers, projectOntoAxis, crampedFrac, crampedToOffset } from "./gradient-coords.js";

/**
 * @typedef {Object} OverlayOps
 * @property {() => string} colorProp - returns "fillColor" or "strokeColor"
 * @property {() => void} applyAllStops - writes all stop offsets/colours back to paper.js
 * @property {() => void} triggerUndo - commits an undo snapshot to scratch-paint's stack
 * @property {(items: any[], cb: () => void) => void} withCollapsedOuterStops
 * @property {(items: any[]) => void} dispatchSelectedItems
 * @property {(paper: any) => number} readCurrentAngle
 * @property {any} addon
 * @property {Function} msg
 */

export class GradientOverlay {
  // -- Private SVG element references
  #svg;
  #axisLine;
  #axisHit;
  #axisOutline;
  #pickerRingWhite;
  #pickerRingBlack;
  #centreHandle;
  #p0Handle;
  #p1Handle;

  // -- Coordinate helpers
  #toSVG;
  #toProject;

  // -- Overlay state
  #attachDragMoved = false;
  #extraHandlePool = [];
  #activePickerGroup = null;
  #pendingDeleteHandle = null;
  #axisMouseDownPos = null;
  #active = true;
  #lastKey = "";

  // -- External references
  #state;
  #ops;
  #paper;
  #picker;

  /**
   * @param {object} state - shared mutable gradient state (see userscript.js)
   * @param {OverlayOps} ops
   * @param {any} paper - paper.js instance
   * @param {HTMLElement} canvasContainer
   * @param {HTMLCanvasElement} canvas
   */
  constructor(state, ops, paper, canvasContainer, canvas) {
    this.#state = state;
    this.#ops = ops;
    this.#paper = paper;
    this.#buildSvgFrame(canvasContainer);
    ({ toSVG: this.#toSVG, toProject: this.#toProject } = makeCoordHelpers(paper, canvas));
    this.#setupDragHandlers();
    this.#setupAxisClick();
    this.#picker = new StopColorPicker({
      msg: ops.msg,
      redux: ops.addon.tab.redux,
      triggerUndo: ops.triggerUndo,
      getCachedPaper: () => state.cachedPaper,
      onClose: () => this.#setPickerHighlight(null),
    });
    this.#startRafLoop();
  }

  // -- Public API
  sync() {
    this.#syncOverlay();
  }

  close() {
    this.#picker.close();
  }

  destroy() {
    this.#active = false;
    this.#svg.remove();
  }

  // -- SVG element helpers
  #svgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  #moveTo(el, x, y) {
    el.setAttribute("transform", `translate(${x},${y})`);
  }

  #setLine(el, x1, y1, x2, y2) {
    el.setAttribute("x1", x1);
    el.setAttribute("y1", y1);
    el.setAttribute("x2", x2);
    el.setAttribute("y2", y2);
  }

  // -- Frame construction
  #buildSvgFrame(canvasContainer) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sa-grad-overlay");
    svg.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:10";
    this.#ops.addon.tab.displayNoneWhileDisabled(svg);
    this.#svg = svg;
    const overlayPaper = "var(--sa-grad-overlay-paper)";
    const overlayInk = "var(--sa-grad-overlay-ink)";
    const overlayShadow = "var(--sa-grad-overlay-shadow)";

    // Axis line: dashed for linear, solid for radial.
    // Two layers: black outline underneath + white line on top for visibility on any background.
    this.#axisOutline = this.#svgEl("line", { stroke: overlayInk, "stroke-width": 4, "stroke-opacity": 0.5 });
    svg.appendChild(this.#axisOutline);
    this.#axisLine = this.#svgEl("line", { stroke: overlayPaper, "stroke-width": 2 });
    svg.appendChild(this.#axisLine);

    // Invisible wider hit-target on the axis line for click-to-add-stop.
    this.#axisHit = this.#svgEl("line", { stroke: "transparent", "stroke-width": 12 });
    this.#axisHit.style.cssText = "pointer-events:stroke;cursor:crosshair";
    svg.appendChild(this.#axisHit);

    // Two-layer floating selection ring (white outer halo + black inner ring).
    // Declared here; appended to svg after the static handles so they render on top.
    // insertBefore(pickerRingWhite) is used when creating pool handles for the same reason.
    this.#pickerRingWhite = this.#svgEl("circle", {
      fill: "none",
      stroke: overlayPaper,
      "stroke-width": 2,
      "pointer-events": "none",
    });
    this.#pickerRingWhite.style.display = "none";
    this.#pickerRingBlack = this.#svgEl("circle", {
      fill: "none",
      stroke: overlayInk,
      "stroke-width": 3.5,
      "pointer-events": "none",
    });
    this.#pickerRingBlack.style.display = "none";

    // Centre handle (radial only): hollow white circle at fc.origin; free drag shifts whole circle.
    // r=6 circle + r=8 shadow -> combined outer radius 8px used for min-distance calculation.
    this.#centreHandle = this.#makeCentreHandle();

    // Colour-stop handles: filled circles.
    // Linear: p0 sits at fc.origin (free drag), p1 at fc.destination (free drag).
    // Radial:  p0 slides along the radius with a minimum pixel offset from centre;
    //          p1 slides freely along the radius.
    // r=7 circle + r=9 shadow -> shadow outer radius 9px used for min-distance calculation.
    this.#p0Handle = this.#makeStopHandle();
    this.#p1Handle = this.#makeStopHandle();

    // Append floating rings last so they render above all static handles.
    svg.appendChild(this.#pickerRingWhite);
    svg.appendChild(this.#pickerRingBlack);
    canvasContainer.appendChild(svg);
  }

  #makeCentreHandle() {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cssText = "pointer-events:all;cursor:pointer";
    g.append(
      this.#svgEl("circle", { r: 8, fill: "var(--sa-grad-overlay-shadow)" }),
      this.#svgEl("circle", { r: 6, fill: "transparent", stroke: "var(--sa-grad-overlay-paper)", "stroke-width": 2 })
    );
    this.#svg.appendChild(g);
    return g;
  }

  #makeStopHandle() {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g._ringR = 11;
    g.style.cssText = "pointer-events:all;cursor:pointer";
    const circle = this.#svgEl("circle", { r: 7, stroke: "var(--sa-grad-overlay-paper)", "stroke-width": 2 });
    g.append(this.#svgEl("circle", { r: 9, fill: "var(--sa-grad-overlay-shadow)" }), circle);
    this.#svg.appendChild(g);
    return { g, circle };
  }

  // -- Main sync
  #syncOverlay() {
    const spModals = this.#ops.addon.tab.redux.state?.scratchPaint?.modals;
    const modalForMode = this.#state.activeColorMode === "stroke" ? spModals?.strokeColor : spModals?.fillColor;
    if (!modalForMode || this.#ops.addon.self.disabled) {
      this.#svg.style.display = "none";
      return;
    }
    const items = this.#paper.project.selectedItems.filter((i) => i.parent instanceof this.#paper.Layer);
    const fc = items[0]?.[this.#ops.colorProp()];
    if (!fc?.gradient) {
      this.#svg.style.display = "none";
      return;
    }
    this.#svg.style.display = "";
    const isRadial = fc.gradient.radial;
    const lerp = (a, b, t) => a + (b - a) * t;

    this.#axisLine.setAttribute("stroke-dasharray", isRadial ? "none" : "4 3");
    this.#axisOutline.setAttribute("stroke-dasharray", isRadial ? "none" : "4 3");
    const op = this.#toSVG(fc.origin);
    const dp = this.#toSVG(fc.destination);
    this.#setLine(this.#axisLine, op.x, op.y, dp.x, dp.y);
    this.#setLine(this.#axisOutline, op.x, op.y, dp.x, dp.y);
    this.#setLine(this.#axisHit, op.x, op.y, dp.x, dp.y);

    const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
    if (isRadial) {
      this.#moveTo(this.#centreHandle, op.x, op.y);
      this.#centreHandle.style.display = "";

      // Cramp p0 so it never visually overlaps the centre or the next handle.
      const p0Frac =
        crampedFrac(0, 1 + this.#state.extraStops.length, this.#state.stops.p0, axisLenPx) ?? this.#state.stops.p0;
      this.#moveTo(this.#p0Handle.g, lerp(op.x, dp.x, p0Frac), lerp(op.y, dp.y, p0Frac));
      // p1 sits at the destination point -- the end of the visible gradient line
      this.#moveTo(this.#p1Handle.g, dp.x, dp.y);
    } else {
      // Linear: p0 handle sits at origin, p1 handle sits at destination (dual-function).
      this.#centreHandle.style.display = "none";
      this.#moveTo(this.#p0Handle.g, op.x, op.y);
      this.#moveTo(this.#p1Handle.g, dp.x, dp.y);
    }

    this.#p0Handle.circle.setAttribute("fill", this.#state.c0hex);
    this.#p1Handle.circle.setAttribute("fill", this.#state.c1hex);

    // Sync extra stop handles -- grow pool as needed, hide unused entries.
    // innerCount: for radial, p0 plus extras are all inner handles; for linear, only extras.
    const innerCount = isRadial ? 1 + this.#state.extraStops.length : this.#state.extraStops.length;
    for (let i = 0; i < this.#state.extraStops.length; i++) {
      if (i >= this.#extraHandlePool.length) this.#extraHandlePool.push(this.#makeExtraStopHandle(i));
      const h = this.#extraHandlePool[i];
      const innerIdx = isRadial ? i + 1 : i;
      const t =
        crampedFrac(innerIdx, innerCount, this.#state.extraStops[i].offset, axisLenPx) ??
        this.#state.extraStops[i].offset;
      const sp = { x: lerp(op.x, dp.x, t), y: lerp(op.y, dp.y, t) };
      this.#moveTo(h.g, sp.x, sp.y);
      h.circle.setAttribute("fill", this.#state.extraStops[i].color);
      // Only clear visibility if this handle is not currently being dragged off-axis.
      if (h.g !== this.#pendingDeleteHandle) h.g.style.visibility = "";
      h.g.style.display = "";
    }
    for (let i = this.#state.extraStops.length; i < this.#extraHandlePool.length; i++) {
      const h = this.#extraHandlePool[i];
      // If a hidden handle had the ring, clear it so the floating ring disappears.
      if (this.#activePickerGroup === h.g) this.#setPickerHighlight(null);
      h.g.style.display = "none";
    }
    // Keep the floating rings in sync as handles are repositioned.
    if (this.#activePickerGroup) {
      const tf = this.#activePickerGroup.getAttribute("transform");
      for (const ring of [this.#pickerRingWhite, this.#pickerRingBlack]) {
        if (tf) ring.setAttribute("transform", tf);
        else ring.removeAttribute("transform");
      }
    }
  }

  // -- Drag helper
  // #attachDragMoved is set to true whenever the mouse moves during a drag.
  // Extra-stop click handlers read it to suppress the click event after drag.
  #attachDrag(handleEl, defaultCursor, onMove, onUp) {
    handleEl.addEventListener("mousedown", (e) => {
      if (this.#ops.addon.self.disabled) return;
      e.stopPropagation();
      e.preventDefault();
      this.#attachDragMoved = false;
      handleEl.style.cursor = "grabbing";
      const moveHandler = (ev) => {
        this.#attachDragMoved = true;
        onMove(this.#toProject(ev.clientX, ev.clientY));
        this.#syncOverlay();
      };
      const upHandler = () => {
        handleEl.style.cursor = defaultCursor;
        document.removeEventListener("mousemove", moveHandler);
        document.removeEventListener("mouseup", upHandler);
        if (onUp) onUp();
        else this.#ops.triggerUndo();
      };
      document.addEventListener("mousemove", moveHandler);
      document.addEventListener("mouseup", upHandler);
    });
  }

  // -- Endpoint drag + click handlers
  #selectedLayers() {
    return this.#paper.project.selectedItems.filter((i) => i.parent instanceof this.#paper.Layer);
  }

  // Sync a p0/p1 colour change (possibly including alpha) back to Redux in a way that is
  // compatible with the opacity-slider addon.
  //
  // Problem: dispatching CHANGE_FILL_COLOR with a hex string (a=1) overwrites any rgba that
  // Redux already holds for the stop.  The opacity-slider reads its alpha from Redux, so its
  // handle goes stale and the next slider interaction snaps to the stale position.
  //
  // Fix: use the same 2-stop-collapse -> CHANGE_SELECTED_ITEMS approach we already use
  // elsewhere.  _colorStateFromGradient calls stop.color.toCSS() which returns "rgba(...)"
  // when a<1 -- so Redux primary/secondary get the full colour including alpha.
  // Then dispatch CHANGE_COLOR_INDEX with the matching index (0=p0, 1=p1) so the opacity
  // addon's prevEventHandler re-reads and repositions its handle.
  #syncPickerColorToRedux(colorIndex) {
    const items = this.#selectedLayers();
    if (!items.length) return;
    // Collapse both fill and stroke to their outer stops during the Redux refresh so the
    // non-active swatch does not fall back to MIXED when the active stop colour changes.
    this.#ops.withCollapsedOuterStops(items, () => this.#ops.dispatchSelectedItems(items));
    // Trigger the opacity-slider addon to re-read Redux and update its handle position.
    this.#ops.addon.tab.redux.dispatch({ type: "scratch-paint/color-index/CHANGE_COLOR_INDEX", index: colorIndex });
  }

  #setupDragHandlers() {
    // Centre handle (radial only): shift origin + destination together, preserving radius.
    this.#attachDrag(this.#centreHandle, "pointer", (projected) => {
      const cp = this.#ops.colorProp();
      for (const item of this.#selectedLayers()) {
        const fc = item[cp];
        if (!fc?.gradient || !fc.gradient.radial) continue;
        const delta = projected.subtract(fc.origin);
        item[cp].destination = fc.destination.add(delta);
        item[cp].origin = projected;
      }
    });

    // p0 handle:
    //   Linear -- free drag repositions fc.origin (the handle IS the axis start).
    //   Radial  -- constrained to radius axis; cramped-space inverse maps the drag position
    //             back to a logical [0,1] offset, preventing overlap with the centre handle.
    this.#attachDrag(this.#p0Handle.g, "pointer", (projected) => {
      const cp = this.#ops.colorProp();
      const fc = this.#selectedLayers()[0]?.[cp];
      if (!fc?.gradient) return;
      if (fc.gradient.radial) {
        const op = this.#toSVG(fc.origin);
        const dp = this.#toSVG(fc.destination);
        const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
        const rawFrac = projectOntoAxis(projected, fc.origin, fc.destination);
        const maxP0 = this.#state.extraStops.length > 0 ? this.#state.extraStops[0].offset : 1;
        this.#state.stops.p0 = clamp(
          crampedToOffset(0, 1 + this.#state.extraStops.length, rawFrac, axisLenPx),
          0,
          maxP0
        );
        this.#ops.applyAllStops();
      } else {
        for (const item of this.#selectedLayers()) {
          const fc = item[cp];
          if (!fc?.gradient || fc.gradient.radial) continue;
          item[cp].origin = projected;
        }
        this.#state.storedAngle = this.#ops.readCurrentAngle(this.#state.cachedPaper);
      }
    });

    // p1 handle:
    //   Linear -- free drag repositions fc.destination (the handle IS the axis end).
    //   Radial  -- free drag repositions fc.destination (the end of the gradient line).
    this.#attachDrag(this.#p1Handle.g, "pointer", (projected) => {
      const cp = this.#ops.colorProp();
      for (const item of this.#selectedLayers()) {
        const fc = item[cp];
        if (!fc?.gradient) continue;
        item[cp].destination = projected;
        if (!fc.gradient.radial) this.#state.storedAngle = this.#ops.readCurrentAngle(this.#state.cachedPaper);
      }
    });

    // Click p0 to colour-pick the first stop; reflects change (including alpha) via Redux.
    this.#p0Handle.g.addEventListener("click", (e) => {
      if (this.#ops.addon.self.disabled || this.#attachDragMoved) return;
      e.stopPropagation();
      this.#setPickerHighlight(this.#p0Handle.g);
      this.#picker.open(
        this.#state.c0css,
        (css) => {
          this.#state.c0css = css;
          this.#state.c0hex = ensureHex(css);
          const cp = this.#ops.colorProp();
          for (const item of this.#selectedLayers()) {
            const g = item[cp]?.gradient;
            if (g?.stops?.length >= 1) g.stops[0].color = new this.#paper.Color(css);
          }
          this.#ops.applyAllStops();
          this.#syncOverlay();
          this.#syncPickerColorToRedux(0);
        },
        e.clientX,
        e.clientY
      );
    });

    // Click p1 to colour-pick the last stop; reflects change (including alpha) via Redux.
    this.#p1Handle.g.addEventListener("click", (e) => {
      if (this.#ops.addon.self.disabled || this.#attachDragMoved) return;
      e.stopPropagation();
      this.#setPickerHighlight(this.#p1Handle.g);
      this.#picker.open(
        this.#state.c1css,
        (css) => {
          this.#state.c1css = css;
          this.#state.c1hex = ensureHex(css);
          const cp = this.#ops.colorProp();
          for (const item of this.#selectedLayers()) {
            const g = item[cp]?.gradient;
            if (g?.stops?.length >= 2) g.stops[g.stops.length - 1].color = new this.#paper.Color(css);
          }
          this.#ops.applyAllStops();
          this.#syncOverlay();
          this.#syncPickerColorToRedux(1);
        },
        e.clientX,
        e.clientY
      );
    });
  }

  // -- Extra stop handles
  // Cleanly remove extra stop at idx: rebuild all selected-item gradients without it
  // (so the WeakSet warm-up count stays consistent), then splice and re-sync.
  #removeExtraStop(idx) {
    const previewExtra = this.#state.extraStops.filter((_, i) => i !== idx);
    const cp = this.#ops.colorProp();
    for (const item of this.#selectedLayers()) {
      if (!item[cp]?.gradient) continue;
      const liveStops = item[cp].gradient.stops;
      const c0 = liveStops[0].color;
      const c1 = liveStops[liveStops.length - 1].color;
      item[cp].gradient = { stops: [c0, ...previewExtra.map((s) => s.color), c1], radial: item[cp].gradient.radial };
      const g2 = item[cp].gradient;
      g2.stops[0].offset = this.#state.stops.p0;
      for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
      g2.stops[g2.stops.length - 1].offset = this.#state.stops.p1;
    }
    this.#state.extraStops.splice(idx, 1);
    this.#ops.applyAllStops();
    this.#syncOverlay();
  }

  #openExtraColorPicker(idx, clientX, clientY, groupEl = null) {
    if (!this.#state.extraStops[idx]) return;
    this.#setPickerHighlight(groupEl);
    this.#picker.open(
      this.#state.extraStops[idx].color,
      (color) => {
        if (this.#state.extraStops[idx]) {
          this.#state.extraStops[idx].color = color;
          this.#ops.applyAllStops();
          this.#syncOverlay();
        }
      },
      clientX,
      clientY
    );
  }

  // Smaller handles (r=5 circle, r=7 shadow) sit between p0 and p1 on the axis.
  // Pool grows as needed; excess handles are hidden when state.extraStops shrinks.
  #makeExtraStopHandle(poolIndex) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g._ringR = 9;
    g.style.cssText = "pointer-events:all;cursor:pointer";
    const circle = this.#svgEl("circle", { r: 5, stroke: "var(--sa-grad-overlay-paper)", "stroke-width": 1.5 });
    g.append(this.#svgEl("circle", { r: 7, fill: "var(--sa-grad-overlay-shadow)" }), circle);
    // Insert before the floating rings so the rings always stay on top.
    this.#svg.insertBefore(g, this.#pickerRingWhite);

    // Colour pick on handle click -- only if the mouse didn't move (not a drag).
    g.addEventListener("click", (e) => {
      if (this.#ops.addon.self.disabled) return;
      if (this.#attachDragMoved) return;
      e.stopPropagation();
      this.#openExtraColorPicker(poolIndex, e.clientX, e.clientY, g);
    });

    // Double-click deletes this stop.
    g.addEventListener("dblclick", (e) => {
      if (this.#ops.addon.self.disabled || this.#attachDragMoved) return;
      e.stopPropagation();
      this.#picker.close();
      this.#removeExtraStop(poolIndex);
      this.#ops.triggerUndo();
    });

    // Drag: constrained to axis between neighbours.
    // If dragged > 25px perpendicular to the axis, enter "pending delete" state.
    // Visual: handle is hidden and the gradient previews without this stop.
    // On mouseup while pending the stop is removed; otherwise it snaps back.
    let pendingDelete = false;
    // True while this stop is in pending-delete state AND had the selection ring;
    // used to restore the ring on snap-back and close the picker on actual delete.
    let pendingDeleteSuppressedRing = false;
    this.#attachDrag(
      g,
      "pointer",
      (projected) => {
        const idx = poolIndex;
        const fc = this.#selectedLayers()[0]?.[this.#ops.colorProp()];
        if (!fc?.gradient || !this.#state.extraStops[idx]) return;
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
          const mView = this.#paper.view.projectToView(projected);
          const aView = this.#paper.view.projectToView(axisClosest);
          const perpPx = Math.sqrt((mView.x - aView.x) ** 2 + (mView.y - aView.y) ** 2);
          pendingDelete = perpPx > 25;
        }
        // Entering pending-delete: hide the ring if this node has it.
        if (pendingDelete && !wasPending) {
          this.#pendingDeleteHandle = g;
          if (this.#activePickerGroup === g) {
            this.#setPickerHighlight(null);
            pendingDeleteSuppressedRing = true;
          }
        }
        // Snapping back from pending-delete: restore the ring.
        if (!pendingDelete && wasPending) {
          this.#pendingDeleteHandle = null;
          if (pendingDeleteSuppressedRing) {
            this.#setPickerHighlight(g);
            pendingDeleteSuppressedRing = false;
          }
        }
        if (pendingDelete) {
          g.style.visibility = "hidden";
          // Preview the gradient without this stop.
          const previewExtra = this.#state.extraStops.filter((_, i) => i !== poolIndex);
          const item = this.#selectedLayers()[0];
          const cp = this.#ops.colorProp();
          if (item?.[cp]?.gradient) {
            const liveStops = item[cp].gradient.stops;
            const liveC0 = liveStops[0].color;
            const liveC1 = liveStops[liveStops.length - 1].color;
            item[cp].gradient = {
              stops: [liveC0, ...previewExtra.map((s) => s.color), liveC1],
              radial: item[cp].gradient.radial,
            };
            const g2 = item[cp].gradient;
            g2.stops[0].offset = this.#state.stops.p0;
            for (let i = 0; i < previewExtra.length; i++) g2.stops[i + 1].offset = previewExtra[i].offset;
            g2.stops[g2.stops.length - 1].offset = this.#state.stops.p1;
          }
        } else {
          g.style.visibility = "";
          circle.setAttribute("fill", this.#state.extraStops[idx].color);
          const rawFrac = projectOntoAxis(projected, A, B);
          const opSVG = this.#toSVG(A),
            dpSVG = this.#toSVG(B);
          const lenPx = Math.hypot(dpSVG.x - opSVG.x, dpSVG.y - opSVG.y);
          const isRad = fc.gradient.radial;
          const innerIdx = isRad ? idx + 1 : idx;
          const innerCount = isRad ? this.#state.extraStops.length + 1 : this.#state.extraStops.length;
          const leftBound = idx === 0 ? (isRad ? this.#state.stops.p0 : 0) : this.#state.extraStops[idx - 1].offset;
          const rightBound =
            idx === this.#state.extraStops.length - 1 ? this.#state.stops.p1 : this.#state.extraStops[idx + 1].offset;
          this.#state.extraStops[idx].offset = clamp(
            crampedToOffset(innerIdx, innerCount, rawFrac, lenPx),
            leftBound,
            rightBound
          );
          this.#ops.applyAllStops();
        }
      },
      () => {
        if (pendingDelete) {
          pendingDelete = false;
          this.#pendingDeleteHandle = null;
          // Ring was already hidden when we entered pending-delete; close the picker too.
          if (pendingDeleteSuppressedRing) {
            pendingDeleteSuppressedRing = false;
            this.#picker.close();
          }
          this.#removeExtraStop(poolIndex);
        } else {
          // Restore visibility in case we entered pending-delete then moved back.
          g.style.visibility = "";
          circle.setAttribute("fill", this.#state.extraStops[poolIndex].color);
        }
        this.#ops.triggerUndo();
      }
    );

    return { g, circle };
  }

  // -- Picker highlight ring
  #setPickerHighlight(group) {
    this.#activePickerGroup = group ?? null;
    if (!group) {
      this.#pickerRingWhite.style.display = "none";
      this.#pickerRingBlack.style.display = "none";
      return;
    }
    const ringR = group._ringR;
    const tf = group.getAttribute("transform");
    // White ring peeks outside the black ring; black ring is at the specified radius.
    for (const [ring, r] of [
      [this.#pickerRingWhite, ringR + 2.5],
      [this.#pickerRingBlack, ringR],
    ]) {
      ring.setAttribute("r", r);
      if (tf) ring.setAttribute("transform", tf);
      else ring.removeAttribute("transform");
      ring.style.display = "";
    }
  }

  // -- Axis click-to-add
  #setupAxisClick() {
    // Single click on the axis line adds a new stop at that position.
    // mousedown stops propagation so the fill popup doesn't close.
    this.#axisHit.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.#axisMouseDownPos = { x: e.clientX, y: e.clientY };
    });
    this.#axisHit.addEventListener("click", (e) => {
      if (this.#ops.addon.self.disabled) return;
      e.stopPropagation();
      // Ignore if the mouse moved more than 4px -- treat as a drag, not a click.
      if (
        this.#axisMouseDownPos &&
        (Math.abs(e.clientX - this.#axisMouseDownPos.x) > 4 || Math.abs(e.clientY - this.#axisMouseDownPos.y) > 4)
      )
        return;
      const fc = this.#selectedLayers()[0]?.[this.#ops.colorProp()];
      if (!fc?.gradient) return;
      const projected = this.#toProject(e.clientX, e.clientY);
      const t = projectOntoAxis(projected, fc.origin, fc.destination);
      // Interpolate colour (+ alpha) between the two adjacent stops.
      // Use live paper.js stop colours so outer-stop alpha is included.
      const liveStops = fc.gradient.stops;
      const allStops = [
        { color: colorToCss(liveStops[0].color), offset: this.#state.stops.p0 },
        ...this.#state.extraStops,
        { color: colorToCss(liveStops[liveStops.length - 1].color), offset: this.#state.stops.p1 },
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
      const op = this.#toSVG(fc.origin);
      const dp = this.#toSVG(fc.destination);
      const axisLenPx = Math.hypot(dp.x - op.x, dp.y - op.y);
      // Clicking before p0 in a radial gradient: promote the click position as the new p0,
      // pushing the current p0 into extra stops so the rest of the gradient is preserved.
      if (isRadial && t < this.#state.stops.p0) {
        this.#state.extraStops.unshift({ color: this.#state.c0css, offset: this.#state.stops.p0 });
        this.#state.stops.p0 = clamp(
          crampedToOffset(0, this.#state.extraStops.length + 2, t, axisLenPx),
          0,
          this.#state.stops.p0 - 0.01
        );
        this.#ops.applyAllStops();
        this.#syncOverlay();
        this.#ops.triggerUndo();
        this.#attachDragMoved = false;
        this.#p0Handle.g.dispatchEvent(
          new MouseEvent("click", { bubbles: true, clientX: e.clientX, clientY: e.clientY })
        );
        return;
      }
      const newInnerIdx = this.#state.extraStops.filter((s) => s.offset < t).length;
      const newInnerCount = isRadial ? this.#state.extraStops.length + 2 : this.#state.extraStops.length + 1;
      const innerIdxForNew = isRadial ? newInnerIdx + 1 : newInnerIdx;
      const offset = crampedToOffset(innerIdxForNew, newInnerCount, t, axisLenPx);
      const newStop = {
        color: blended,
        offset: clamp(offset, this.#state.stops.p0 + 0.01, this.#state.stops.p1 - 0.01),
      };
      this.#state.extraStops.push(newStop);
      this.#state.extraStops.sort((a, b) => a.offset - b.offset);
      this.#ops.applyAllStops();
      this.#syncOverlay(); // grows pool so the new handle exists
      const newIdx = this.#state.extraStops.indexOf(newStop);
      // syncOverlay() above has grown the pool, so the handle group exists.
      this.#openExtraColorPicker(newIdx, e.clientX, e.clientY, this.#extraHandlePool[newIdx]?.g);
      this.#ops.triggerUndo();
    });
  }

  // -- RAF view-change loop
  #startRafLoop() {
    const rafLoop = () => {
      if (!this.#active) return;
      const m = this.#paper.view.matrix;
      const key = `${m.a.toFixed(3)},${m.tx.toFixed(1)},${m.ty.toFixed(1)}`;
      if (key !== this.#lastKey) {
        this.#lastKey = key;
        this.#syncOverlay();
      }
      requestAnimationFrame(rafLoop);
    };
    requestAnimationFrame(rafLoop);
  }
}
