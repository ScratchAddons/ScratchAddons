export default async function ({ addon, msg }) {
  addon.tab.redux.initialize();

  // ── Tool state ─────────────────────────────────────────────────────────
  let isToolActive = false;
  let prevReduxMode = null;
  let paper = null;
  let corners = []; // CornerHandle[]
  let lastDraggedCorner = null; // rendered last (on top) in SVG z-order
  // paper.Path → Array<{x, y, hix, hiy, hox, hoy}>
  let pathSnapshots = new Map();
  let cornerTool = null; // paper.Tool while active (canvas clicks + keyboard only)
  let madeChanges = false;
  // Redux statechanged listener (added while tool is active, removed on deactivation)
  let modeChangeHandler = null;

  // ── SVG overlay refs ───────────────────────────────────────────────────
  // The widget circles are DOM SVG elements sitting on top of the paper canvas,
  // never part of the paper project — so they can never leak into undo snapshots.
  let overlaySvg = null; // the <svg> DOM element
  let canvas = null; // the paper.js <canvas> element (coordinate conversion)
  let canvasContainer = null;

  // ── Side-toolbar button ────────────────────────────────────────────────
  // Injected into paint-editor_mode-selector alongside Select, Reshape, etc.
  // Native side-toolbar buttons are bare spans containing only an <img>;
  // classes are extracted at runtime so hash-mangling is handled automatically.
  let isSelectedClass = "";

  const rcBtn = document.createElement("span");
  rcBtn.setAttribute("role", "button");
  rcBtn.title = msg("round-corners");
  addon.tab.displayNoneWhileDisabled(rcBtn);

  const rcIcon = document.createElement("img");
  rcIcon.alt = msg("round-corners");
  rcIcon.draggable = false;
  rcIcon.src = `${addon.self.dir}/icons/round-corners.svg`;

  rcBtn.appendChild(rcIcon);

  // ── Math utilities ─────────────────────────────────────────────────────

  // Line–line intersection: returns the point where (p1 + t·d1) = (p2 + s·d2),
  // or null if the lines are parallel.
  const lineIntersect = (p1, d1, p2, d2) => {
    const det = -d1.x * d2.y + d2.x * d1.y;
    if (Math.abs(det) < 1e-10) return null;
    const t = (-(p2.x - p1.x) * d2.y + d2.x * (p2.y - p1.y)) / det;
    return new paper.Point(p1.x + t * d1.x, p1.y + t * d1.y);
  };

  // Bezier handle length for a circular-arc approximation of a rounded corner
  // with radius r. vPrev and vNext are unit vectors from the corner tip toward
  // each adjacent segment.
  const handleLen = (r, vPrev, vNext) => {
    const cos = Math.max(-1, Math.min(1, vPrev.dot(vNext)));
    const interiorAngle = Math.acos(cos);
    const halfExt = (Math.PI - interiorAngle) / 2;
    if (halfExt < 1e-6) return 0;
    return r * (4 / 3) * Math.tan(halfExt / 2);
  };

  // Screen position of a corner widget: the centre of the rounding circle.
  // Placing the widget here means the mouse is always exactly at the circle centre
  // while dragging, giving a direct 1:1 feel between cursor position and radius.
  // Circle centre is at distance r/sin(α/2) from the corner tip along the bisector.
  const widgetPt = (corner) =>
    corner.radius === 0
      ? corner.origCorner.clone()
      : corner.origCorner.add(corner.bisector.multiply(corner.radius / corner.sinHalfAngle));

  // ── Coordinate conversion (same pattern as paint-gradient-editor) ──────
  // Convert a paper-space Point → SVG pixel position within canvasContainer.
  const toSVG = (pt) => {
    const vp = paper.view.projectToView(pt);
    return { x: vp.x + canvas.offsetLeft, y: vp.y + canvas.offsetTop };
  };
  // Convert a DOM clientX/clientY → paper-space Point.
  const toProject = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return paper.view.viewToProject(new paper.Point(clientX - rect.left, clientY - rect.top));
  };

  // ── Corner detection ───────────────────────────────────────────────────

  // Handles shorter than this (in paper-space units) are treated as zero.
  const EPS = 0.5;

  const isSharp = (seg) => seg.handleIn.length < EPS && seg.handleOut.length < EPS;

  // Returns true when segment A and the following segment B look like a
  // tangent-continuous circular-arc produced by a previous corner-rounding:
  //   • A has no handleIn, B has no handleOut (clean straight-to-arc transitions)
  //   • A has a handleOut and B has a handleIn (the arc cubic handles)
  //   • Tangent-continuity: incoming direction at A matches A.handleOut, and
  //     outgoing direction at B matches −B.handleIn.
  const isArcPair = (A, B) => {
    if (A.handleIn.length > EPS || B.handleOut.length > EPS) return false;
    if (A.handleOut.length < EPS || B.handleIn.length < EPS) return false;
    const prevA = A.previous;
    const nextB = B.next;
    if (!prevA || !nextB) return false;
    // At P1: direction prevA→A must align with A.handleOut.
    // When adjacent arcs are maximally rounded their tangent endpoints coincide,
    // so prevA.point ≈ A.point and the chord is near-zero.  Fall back to the
    // exit tangent of the previous bezier at prevA, which is −prevA.handleIn.
    const inDirVec = A.point.subtract(prevA.point);
    const inDir =
      inDirVec.length > 0.01
        ? inDirVec.normalize()
        : prevA.handleIn.length > EPS
          ? prevA.handleIn.multiply(-1).normalize()
          : null;
    if (!inDir) return false;
    if (inDir.dot(A.handleOut.normalize()) < 0.85) return false;
    // At P2: direction B→nextB must align with −B.handleIn.
    // Same fallback: when B.point ≈ nextB.point use nextB's entry tangent (handleOut).
    const outDirVec = nextB.point.subtract(B.point);
    const outDir =
      outDirVec.length > 0.01
        ? outDirVec.normalize()
        : nextB.handleOut.length > EPS
          ? nextB.handleOut.normalize()
          : null;
    if (!outDir) return false;
    if (outDir.dot(B.handleIn.multiply(-1).normalize()) < 0.85) return false;
    return true;
  };

  // Returns true when segment A and the following segment B form a rounded corner
  // in a "native" (non-rounded-by-us) smooth shape such as a circle drawn by the
  // circle tool.  In this case BOTH A and B have all handles set.  We recover the
  // virtual corner tip by intersecting lines through A.handleOut and B.handleIn —
  // both of which point from their respective arc endpoints toward the corner tip.
  // Build a CornerHandle for a sharp corner at segment index i.
  const buildSharpCorner = (pathItem, i) => {
    const segs = pathItem.segments;
    const n = segs.length;
    const seg = segs[i];
    const prev = segs[(i - 1 + n) % n];
    const next = segs[(i + 1) % n];
    const toPrev = prev.point.subtract(seg.point);
    const toNext = next.point.subtract(seg.point);
    const prevLen = toPrev.length;
    const nextLen = toNext.length;
    if (prevLen < 0.01 || nextLen < 0.01) return null;
    const vPrev = toPrev.normalize();
    const vNext = toNext.normalize();
    if (vPrev.dot(vNext) > 0.98) return null; // nearly straight — skip
    const alpha = Math.acos(Math.max(-1, Math.min(1, vPrev.dot(vNext))));
    const sinHalfAngle = Math.sin(alpha / 2);
    const tanHalfAngle = Math.tan(alpha / 2);
    return {
      pathItem,
      segIndex: i,
      isArc: false,
      origCorner: seg.point.clone(),
      radius: 0,
      // Max radius so that the tangent point stays within the shorter adjacent edge.
      // Tangent distance d = r / tan(α/2), so r_max = min_edge * tan(α/2).
      maxRadius: Math.min(prevLen, nextLen) * tanHalfAngle,
      prevLen,
      nextLen,
      startRadius: 0,
      selected: true,
      widget: null,
      bisector: vPrev.add(vNext).normalize(),
      vPrev,
      vNext,
      sinHalfAngle,
      tanHalfAngle,
    };
  };

  // Build a CornerHandle for an already-rounded arc starting at segment index i
  // (A = segs[i], B = segs[i+1]).  The original corner tip is reconstructed by
  // extending the adjacent straight edges to their intersection.
  const buildArcCorner = (pathItem, i) => {
    const segs = pathItem.segments;
    const n = segs.length;
    const A = segs[i];
    const B = segs[(i + 1) % n];
    const prev = segs[(i - 1 + n) % n];
    const next = segs[(i + 2) % n];
    // dir1: direction of the incoming edge at A (FROM prev TOWARD the corner tip).
    // When adjacent arcs touch, prev.point ≈ A.point so the chord is near-zero;
    // fall back to the exit tangent of the previous arc encoded in prev.handleIn.
    // (prev is a B-type arc segment: its handleIn = -vNext*h, so -handleIn points
    //  from the previous corner tip toward A — i.e. the same edge direction.)
    const dir1raw = A.point.subtract(prev.point);
    const dir1 =
      dir1raw.length > 0.5
        ? dir1raw.normalize()
        : prev.handleIn.length > EPS
          ? prev.handleIn.multiply(-1).normalize()
          : null;
    if (!dir1) return null;
    // dir2: direction of the outgoing edge at B (FROM next TOWARD the corner tip).
    // Same fallback when next.point ≈ B.point.
    const dir2raw = B.point.subtract(next.point);
    const dir2 = dir2raw.length > 0.5 ? dir2raw.normalize() : B.handleIn.length > EPS ? B.handleIn.normalize() : null;
    if (!dir2) return null;
    const orig = lineIntersect(A.point, dir1, B.point, dir2);
    if (!orig) return null;
    const vPrev = prev.point.subtract(orig).normalize();
    const vNext = next.point.subtract(orig).normalize();
    if (vPrev.dot(vNext) > 0.98) return null;
    const alpha = Math.acos(Math.max(-1, Math.min(1, vPrev.dot(vNext))));
    const sinHalfAngle = Math.sin(alpha / 2);
    const tanHalfAngle = Math.tan(alpha / 2);
    // d = tangent-point distance from reconstructed corner tip to the arc endpoint.
    // r = actual circle radius = d * tan(α/2).
    const d = A.point.subtract(orig).length;
    if (d < 0.1) return null;
    const r = d * tanHalfAngle;
    const prevLen = prev.point.subtract(orig).length;
    const nextLen = next.point.subtract(orig).length;
    return {
      pathItem,
      segIndex: i,
      isArc: true,
      origCorner: orig,
      radius: r,
      maxRadius: Math.min(prevLen, nextLen) * tanHalfAngle,
      prevLen,
      nextLen,
      startRadius: r,
      selected: true,
      widget: null,
      bisector: vPrev.add(vNext).normalize(),
      vPrev,
      vNext,
      sinHalfAngle,
      tanHalfAngle,
    };
  };

  // Walk all selected closed paths on the painting layer and build a
  // CornerHandle for every detected sharp corner and rounded arc.
  const scanCorners = () => {
    corners = [];
    if (!paper) return;
    const selected = paper.project.selectedItems.filter(
      (item) =>
        item.layer?.data?.isPaintingLayer &&
        !(item instanceof paper.Path && item.parent instanceof paper.CompoundPath) &&
        (item instanceof paper.Path || item instanceof paper.CompoundPath)
    );
    for (const item of selected) {
      const paths = item instanceof paper.CompoundPath ? item.children.slice() : [item];
      for (const path of paths) {
        if (path.segments.length < 3) continue;
        const n = path.segments.length;
        const closed = path.closed;
        // Mark arc pair start (A) and both members of each arc pair.
        // arcStarts is populated directly when isArcPair fires so that
        // adjacent pairs (no sharp gap between them) are handled correctly.
        // For open paths, skip the wrap-around pair (n-1, 0) — not a real edge.
        const arcScanEnd = closed ? n : n - 1;
        const arcUsed = new Set();
        const arcStarts = new Set();
        for (let i = 0; i < arcScanEnd; i++) {
          const A = path.segments[i];
          const B = path.segments[(i + 1) % n];
          if (isArcPair(A, B)) {
            arcStarts.add(i);
            arcUsed.add(i);
            arcUsed.add((i + 1) % n);
          }
        }
        // Build a corner handle for each arc start and each non-arc sharp corner.
        // For open paths, endpoints (0 and n-1) have only one adjacent edge so skip them.
        const cornerStart = closed ? 0 : 1;
        const cornerEnd = closed ? n : n - 1;
        for (let i = cornerStart; i < cornerEnd; i++) {
          if (arcStarts.has(i)) {
            const c = buildArcCorner(path, i);
            if (c) corners.push(c);
          } else if (!arcUsed.has(i) && isSharp(path.segments[i])) {
            const c = buildSharpCorner(path, i);
            if (c) corners.push(c);
          }
        }
      }
    }
  };

  // ── Snapshot helpers ───────────────────────────────────────────────────

  const snapPath = (path) =>
    path.segments.map((s) => ({
      x: s.point.x,
      y: s.point.y,
      hix: s.handleIn.x,
      hiy: s.handleIn.y,
      hox: s.handleOut.x,
      hoy: s.handleOut.y,
    }));

  // Restore a path to a previously snapshotted state by rewriting its segments
  // in-place.  Adjusts segment count as needed.
  const restorePath = (path, snap) => {
    while (path.segments.length > snap.length) path.removeSegment(path.segments.length - 1);
    while (path.segments.length < snap.length) path.add(new paper.Segment());
    for (let i = 0; i < snap.length; i++) {
      const s = snap[i];
      path.segments[i].point = new paper.Point(s.x, s.y);
      path.segments[i].handleIn = new paper.Point(s.hix, s.hiy);
      path.segments[i].handleOut = new paper.Point(s.hox, s.hoy);
    }
  };

  const takeSnapshots = () => {
    pathSnapshots = new Map();
    const seen = new Set();
    for (const c of corners) {
      if (!seen.has(c.pathItem)) {
        seen.add(c.pathItem);
        pathSnapshots.set(c.pathItem, snapPath(c.pathItem));
      }
    }
  };

  // ── Corner rounding application ─────────────────────────────────────────

  // Apply the current radius of one corner to the (already snapshot-restored) path.
  // Segment indices reference the original snapshot positions.
  // Corners must be applied in descending segIndex order so that modifications
  // at higher indices do not shift the indices of lower ones.
  const applySingleCorner = (pathItem, corner) => {
    const r = corner.radius;
    if (corner.isArc) {
      if (r < 0.1) {
        // Collapse the arc back to a sharp corner.
        pathItem.segments[corner.segIndex].point = corner.origCorner.clone();
        pathItem.segments[corner.segIndex].handleIn = new paper.Point(0, 0);
        pathItem.segments[corner.segIndex].handleOut = new paper.Point(0, 0);
        pathItem.removeSegment(corner.segIndex + 1);
      } else {
        // Replace the existing A/B segments with a new arc at updated radius.
        // d = tangent-point distance from corner tip; different from r for non-90° corners.
        const d = r / corner.tanHalfAngle;
        const P1 = corner.origCorner.add(corner.vPrev.multiply(d));
        const P2 = corner.origCorner.add(corner.vNext.multiply(d));
        const h = handleLen(r, corner.vPrev, corner.vNext);
        pathItem.segments[corner.segIndex].point = P1;
        pathItem.segments[corner.segIndex].handleIn = new paper.Point(0, 0);
        // Handle points BACK toward the original corner tip → convex arc
        pathItem.segments[corner.segIndex].handleOut = corner.vPrev.multiply(-h);
        // Use modular index: the B segment of a wrap-around arc (segIndex = n-1)
        // lives at index 0, not index n.
        const bIdx = (corner.segIndex + 1) % pathItem.segments.length;
        pathItem.segments[bIdx].point = P2;
        pathItem.segments[bIdx].handleIn = corner.vNext.multiply(-h);
        pathItem.segments[bIdx].handleOut = new paper.Point(0, 0);
      }
    } else {
      if (r < 0.1) return; // already sharp — nothing to modify
      const d = r / corner.tanHalfAngle;
      const P1 = corner.origCorner.add(corner.vPrev.multiply(d));
      const P2 = corner.origCorner.add(corner.vNext.multiply(d));
      const h = handleLen(r, corner.vPrev, corner.vNext);
      // Insert the new P2 segment immediately after the corner, then rewrite the
      // corner segment in-place as P1.  Process order (highest index first) means
      // this insertion does not disturb any not-yet-processed lower-index corners.
      pathItem.insertSegments(corner.segIndex + 1, [
        // handleIn points back toward the corner tip → convex arc
        new paper.Segment(P2, corner.vNext.multiply(-h), new paper.Point(0, 0)),
      ]);
      pathItem.segments[corner.segIndex].point = P1;
      pathItem.segments[corner.segIndex].handleIn = new paper.Point(0, 0);
      // handleOut points back toward the corner tip → convex arc
      pathItem.segments[corner.segIndex].handleOut = corner.vPrev.multiply(-h);
    }
  };

  // Restore every affected path to its snapshot state then re-apply all current
  // radii.  Called on every drag tick for live preview.
  const reapplyAll = () => {
    const byPath = new Map();
    for (const c of corners) {
      if (!byPath.has(c.pathItem)) byPath.set(c.pathItem, []);
      byPath.get(c.pathItem).push(c);
    }
    for (const [pathItem, cs] of byPath) {
      const snap = pathSnapshots.get(pathItem);
      if (!snap) continue;
      restorePath(pathItem, snap);
      // Descending segIndex so that insertions/removals at higher indices do not
      // invalidate the indices of corners further down the segment list.
      for (const c of cs.slice().sort((a, b) => b.segIndex - a.segIndex)) {
        applySingleCorner(pathItem, c);
      }
    }
  };

  // ── SVG widget overlay ─────────────────────────────────────────────────
  // Circles are DOM SVG elements — completely invisible to paper.project.exportJSON()
  // and therefore can never contaminate undo/redo snapshots.

  const svgNS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const moveTo = (el, x, y) => el.setAttribute("transform", `translate(${x},${y})`);

  // Create the <svg> element and attach it to canvasContainer.
  const buildOverlaySvg = () => {
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:10";
    addon.tab.displayNoneWhileDisabled(svg);
    canvasContainer.appendChild(svg);
    return svg;
  };

  // Rebuild all corner widget circles inside overlaySvg.
  // Each corner gets a <g> with a drop-shadow and a main circle.
  // The <g> owns its own mousedown → doc mousemove/mouseup drag closure.
  const drawWidgets = () => {
    if (!overlaySvg) return;
    while (overlaySvg.firstChild) overlaySvg.removeChild(overlaySvg.firstChild);

    // Render lastDraggedCorner last so it sits on top in SVG z-order.
    // This ensures the user always grabs the most-recently-touched handle
    // when handles overlap at maximum rounding.
    const orderedCorners =
      lastDraggedCorner && corners.includes(lastDraggedCorner)
        ? [...corners.filter((c) => c !== lastDraggedCorner), lastDraggedCorner]
        : corners;

    for (const corner of orderedCorners) {
      const { x, y } = toSVG(widgetPt(corner));
      const g = document.createElementNS(svgNS, "g");
      g.style.cssText = "pointer-events:all;cursor:pointer";
      moveTo(g, x, y);

      // Drop-shadow ring, then main circle.
      // Selected: white fill + blue stroke. Unselected: transparent fill + grey stroke.
      if (corner.selected) {
        g.appendChild(svgEl("circle", { r: 8, fill: "rgba(0,0,0,0.25)" }));
        g.appendChild(svgEl("circle", { r: 6, fill: "white", stroke: "#388fe5", "stroke-width": 2 }));
      } else {
        g.appendChild(svgEl("circle", { r: 7, fill: "rgba(0,0,0,0.12)" }));
        g.appendChild(svgEl("circle", { r: 5.5, fill: "none", stroke: "#888", "stroke-width": 1.5 }));
      }
      // Enlarged invisible hit target so clicks within 20px of any widget centre
      // register as a widget click rather than falling through to the canvas.
      g.appendChild(svgEl("circle", { r: 20, fill: "transparent" }));

      // ── Drag handling ─────────────────────────────────────────────────
      // The <g> element sits above the canvas (pointer-events:all), so SVG
      // mousedown stops the event reaching paper.js entirely — no shared flag needed.
      g.addEventListener("mousedown", (e) => {
        if (addon.self.disabled) return;
        e.stopPropagation();
        e.preventDefault();

        // The hit circle is r=20 and handles may overlap, so find whichever corner
        // centre is closest to the click — that is the one the user intended to target.
        const svgRect = overlaySvg.getBoundingClientRect();
        const cx = e.clientX - svgRect.left;
        const cy = e.clientY - svgRect.top;
        let activeCorner = corner;
        let closestDist = Infinity;
        for (const c of corners) {
          const p = toSVG(widgetPt(c));
          const d = Math.hypot(cx - p.x, cy - p.y);
          if (d < closestDist) {
            closestDist = d;
            activeCorner = c;
          }
        }

        // Remember whether this corner was already selected before the click,
        // so we can defer the "deselect others" action until mouseup if no drag
        // happened (dragging a selected corner should keep all selected corners moving).
        const wasSelected = activeCorner.selected;
        lastDraggedCorner = activeCorner;

        if (e.shiftKey) {
          activeCorner.selected = !activeCorner.selected;
        } else if (!activeCorner.selected) {
          // Clicking an unselected corner always selects only it immediately.
          for (const c of corners) c.selected = false;
          activeCorner.selected = true;
        }
        // If corner was already selected (no shift), don't change selection yet —
        // wait for mouseup.  If the user drags, we keep the multi-selection intact.

        const dragCorner = activeCorner; // closed over for this drag
        let didDrag = false;

        // ── Pre-scan: cap maxRadius to prevent arc overlap on shared segments ──
        // When two adjacent selected corners both expand, their tangent points
        // travel toward each other along the shared segment.  Equal split:
        // each gets at most half the original shared edge as tangent distance.
        //
        // Key: use (B.origCorner - A.origCorner)·A.vNext as the available length.
        // This is based on the stable reconstructed corner tips, so it gives the
        // correct original edge length even after the path has already been rounded
        // and re-scanned (unlike A.nextLen which shrinks each time).
        const savedMaxRadius = corners.map((c) => c.maxRadius);
        const applyAdjacentConstraints = () => {
          // Group corners by path (they are already in ascending segIndex order).
          const byPath = new Map();
          for (const c of corners) {
            if (!byPath.has(c.pathItem)) byPath.set(c.pathItem, []);
            byPath.get(c.pathItem).push(c);
          }
          for (const [path, pc] of byPath) {
            const pn = pc.length;
            if (pn < 2) continue;
            for (let idx = 0; idx < pn; idx++) {
              // For open paths skip the wrap-around pair (no edge from last to first).
              if (!path.closed && idx === pn - 1) continue;
              const A = pc[idx];
              const B = pc[(idx + 1) % pn];
              if (!A.selected || !B.selected) continue;
              // Total original edge length between the two corner tips.
              // A.vNext points from A's corner toward the next original vertex.
              // Dot product extracts the component along that direction.
              const totalAvailable = B.origCorner.subtract(A.origCorner).dot(A.vNext);
              if (totalAvailable <= 0.1) continue;
              const dMax = totalAvailable / 2;
              A.maxRadius = Math.min(A.maxRadius, dMax * A.tanHalfAngle);
              B.maxRadius = Math.min(B.maxRadius, dMax * B.tanHalfAngle);
            }
          }
        };
        applyAdjacentConstraints();

        const onMove = (ev) => {
          if (addon.self.disabled) return;
          didDrag = true;
          const pt = toProject(ev.clientX, ev.clientY);
          // Direct mapping: project the mouse position onto the bisector from the
          // corner tip.  That projection distance equals r/sin(α/2) when the mouse
          // is exactly at the circle centre, so r = projection * sin(α/2).
          // This means the cursor is always at the circle centre — a 1:1 feel.
          const projected = pt.subtract(dragCorner.origCorner).dot(dragCorner.bisector);
          const rDragged = Math.max(0, Math.min(projected * dragCorner.sinHalfAngle, dragCorner.maxRadius));
          // Apply the same absolute radius to every other selected corner, capped
          // at each corner's own maximum.
          for (const c of corners) {
            if (!c.selected) continue;
            c.radius = Math.max(0, Math.min(rDragged, c.maxRadius));
          }
          reapplyAll();
          madeChanges = true;
          drawWidgets();
          paper.view.update();
        };

        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          // Restore the unconstrained maxRadius values (constraints were only
          // needed during this drag to prevent arc overlap).
          corners.forEach((c, i) => (c.maxRadius = savedMaxRadius[i]));
          if (!didDrag && !e.shiftKey && wasSelected) {
            // Pure click on an already-selected corner: now deselect all others.
            for (const c of corners) c.selected = false;
            activeCorner.selected = true;
            drawWidgets();
          }
          if (didDrag && madeChanges) {
            triggerUpdateImage();
            // Rescan from the committed geometry so segIndex values stay valid.
            const prevSel = corners.filter((c) => c.selected).map((c) => c.origCorner.clone());
            scanCorners();
            for (const c of corners) {
              c.selected = prevSel.some((pt) => pt.isClose(c.origCorner, 1.0));
            }
            takeSnapshots();
            drawWidgets();
          }
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        drawWidgets(); // reflect new selection state immediately
      });

      overlaySvg.appendChild(g);
    }
  };

  // ── Undo snapshot (identical pattern to paint-boolean-ops) ────────────

  const triggerUpdateImage = () => {
    const el = document.querySelector("[class^='paint-editor_canvas-container']");
    if (!el) return;
    let fiber = el[addon.tab.traps.getInternalKey(el)];
    while (fiber && typeof fiber.stateNode?.handleUpdateImage !== "function") fiber = fiber.return;
    if (typeof fiber?.stateNode?.handleUpdateImage === "function") fiber.stateNode.handleUpdateImage();
  };

  // ── Tool lifecycle ─────────────────────────────────────────────────────

  // Clean up overlay, tool, and state.  If restoreMode is true also dispatch
  // a CHANGE_MODE to restore the paint editor to the mode that was active before
  // we took over (normally true; false when the mode changed externally).
  const deactivateTool = ({ restoreMode = true } = {}) => {
    if (!isToolActive) return;
    // DOM SVG never touches the paper project, so no pre-clear needed before
    // triggerUpdateImage() — this is the key advantage over the old layer approach.
    if (madeChanges) triggerUpdateImage();
    madeChanges = false;
    if (modeChangeHandler) {
      addon.tab.redux.removeEventListener("statechanged", modeChangeHandler);
      modeChangeHandler = null;
    }
    // Hide (not remove) the SVG so it can be reused next activation.
    if (overlaySvg) {
      while (overlaySvg.firstChild) overlaySvg.removeChild(overlaySvg.firstChild);
      overlaySvg.style.display = "none";
    }
    corners = [];
    lastDraggedCorner = null;
    pathSnapshots = new Map();
    if (cornerTool) {
      cornerTool.remove();
      cornerTool = null;
    }
    isToolActive = false;
    if (isSelectedClass) rcBtn.classList.remove(isSelectedClass);
    if (restoreMode) {
      const mode = prevReduxMode ?? "SELECT";
      prevReduxMode = null;
      addon.tab.redux.dispatch({ type: "scratch-paint/modes/CHANGE_MODE", mode });
    } else {
      prevReduxMode = null;
    }
  };

  const activateTool = async () => {
    // Toggle off if already active.
    if (isToolActive) {
      deactivateTool();
      return;
    }

    paper = await addon.tab.traps.getPaper();
    if (!paper) return;

    canvasContainer = document.querySelector("[class^='paint-editor_canvas-container']");
    canvas = canvasContainer?.querySelector("canvas");
    if (!canvasContainer || !canvas) return;

    prevReduxMode = addon.tab.redux.state?.scratchPaint?.mode ?? null;

    // Dispatch ROUNDED_RECT: deactivates the current tool container cleanly
    // and leaves no native side-toolbar button highlighted (ROUNDED_RECT is a
    // registered-but-stub mode with no toolbar button).
    addon.tab.redux.dispatch({ type: "scratch-paint/modes/CHANGE_MODE", mode: "ROUNDED_RECT" });

    // Wait two animation frames for React to flush the dispatch.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    if (addon.self.disabled) return;

    // Scan whatever is currently selected (may be nothing — user can click a shape).
    scanCorners();
    takeSnapshots();

    // Build the SVG overlay if it doesn't exist yet, or reattach if it was removed.
    if (!overlaySvg || !canvasContainer.contains(overlaySvg)) {
      overlaySvg = buildOverlaySvg();
    }
    overlaySvg.style.display = "";
    drawWidgets();

    // Minimal paper.Tool: only intercepts canvas clicks (shape selection) and
    // keyboard shortcuts.  All widget interaction is handled by the SVG elements
    // directly — SVG mousedown stops propagation so this tool never sees widget
    // clicks (the SVG <g> sits above the canvas in the DOM stacking order).
    cornerTool = new paper.Tool();

    cornerTool.onMouseDown = (e) => {
      if (addon.self.disabled) return;
      // Hit-test the painting layer for a shape to select.
      const paintLayer = paper.project.layers.find((l) => l.data.isPaintingLayer);
      const hitResult = paintLayer
        ? paper.project.hitTest(e.point, {
            fill: true,
            stroke: true,
            tolerance: 4 / paper.view.zoom,
            match: (r) => paintLayer.isAncestor(r.item) || r.item.layer === paintLayer,
          })
        : null;

      if (hitResult) {
        const target = hitResult.item.parent instanceof paper.Layer ? hitResult.item : hitResult.item.parent;
        for (const item of paper.project.selectedItems) item.selected = false;
        target.selected = true;
        if (madeChanges) triggerUpdateImage();
        madeChanges = false;
        scanCorners();
        takeSnapshots();
      } else {
        // Clicked on empty canvas — deselect the paper shape and all corner handles.
        for (const item of paper.project.selectedItems) item.selected = false;
        corners = [];
        pathSnapshots = new Map();
      }
      drawWidgets();
    };

    cornerTool.onKeyDown = (e) => {
      if (addon.self.disabled) return;
      if (e.key === "escape" || e.key === "Escape") deactivateTool();
    };

    cornerTool.activate();
    isToolActive = true;
    if (isSelectedClass) rcBtn.classList.add(isSelectedClass);

    // Watch for tool switches (CHANGE_MODE), tab navigation, and undo/redo events.
    modeChangeHandler = ({ detail }) => {
      if (!isToolActive) return;
      const type = detail.action?.type;
      if (type === "scratch-paint/modes/CHANGE_MODE") {
        deactivateTool({ restoreMode: false });
      } else if (type === "scratch-gui/navigation/ACTIVATE_TAB") {
        // User is switching tabs. Deactivate NOW while the paint editor is still
        // fully alive — triggerUpdateImage() and CHANGE_MODE SELECT both work
        // correctly here. By the time toolsLoop fires on nav-back, isToolActive
        // will already be false so it does nothing.
        const newTab = addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex ?? -1;
        if (newTab !== 1) {
          // Switching away from costumes tab.
          deactivateTool({ restoreMode: true });
        }
      } else if (type === "scratch-paint/undo/UNDO" || type === "scratch-paint/undo/REDO") {
        // scratch-paint's _restore() reimports the paper project from JSON.
        // The SVG overlay is DOM-only so it survives untouched.
        // Wait one frame for paper.js to finish restoring, then rescan.
        requestAnimationFrame(() => {
          if (!isToolActive) return;
          madeChanges = false;
          const prevSel = corners.filter((c) => c.selected).map((c) => c.origCorner.clone());
          scanCorners();
          for (const c of corners) {
            c.selected = prevSel.some((pt) => pt.isClose(c.origCorner, 1.0));
          }
          takeSnapshots();
          drawWidgets();
        });
      }
    };
    addon.tab.redux.addEventListener("statechanged", modeChangeHandler);
  };

  addon.self.addEventListener("disabled", () => deactivateTool({ restoreMode: true }));

  rcBtn.addEventListener("click", () => {
    if (addon.self.disabled) return;
    activateTool();
  });

  // ── Side-toolbar injection loop ────────────────────────────────────────
  // Waits for the paint-editor_mode-selector (the vertical toolbar on the left),
  // extracts native button/icon/is-selected CSS classes at runtime, and appends
  // our button to the end of the list alongside Select, Reshape, etc.
  const toolsLoop = async () => {
    while (true) {
      const modeSelector = await addon.tab.waitForElement("[class*='paint-editor_mode-selector']", {
        markAsSeen: true,
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });

      // If the user navigated away and came back: ACTIVATE_TAB in modeChangeHandler
      // should have already deactivated the tool cleanly. This is a safety net only.
      if (isToolActive) deactivateTool({ restoreMode: false });

      // Extract native classes each iteration so hash-mangling is always current.
      const anyToolBtn = modeSelector.querySelector("[class*='mod-tool-select']");
      const anyToolIcon = modeSelector.querySelector("[class*='tool-select-icon']");
      const selectedBtn = modeSelector.querySelector("[class*='is-selected']");

      // Copy button and icon classes to match native toolbar appearance.
      if (anyToolBtn) rcBtn.className = anyToolBtn.className;
      if (anyToolIcon) rcIcon.className = anyToolIcon.className;

      // Store the is-selected class for use when the tool activates.
      isSelectedClass = selectedBtn ? ([...selectedBtn.classList].find((c) => c.includes("is-selected")) ?? "") : "";

      // Ensure the button does not start in the selected state.
      if (isSelectedClass) rcBtn.classList.remove(isSelectedClass);

      // Hide in bitmap mode — corner rounding only works on vector paths.
      const isBitmap = () => {
        const fmt = addon.tab.redux.state?.scratchPaint?.format ?? "";
        return fmt === "BITMAP" || fmt === "BITMAP_SKIP_CONVERT";
      };
      rcBtn.style.display = isBitmap() ? "none" : "";

      modeSelector.appendChild(rcBtn);
    }
  };

  // Also respond to live format switches (Convert to Bitmap / Convert to Vector).
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action?.type !== "scratch-paint/formats/CHANGE_FORMAT") return;
    const fmt = detail.action.format ?? "";
    const bitmap = fmt === "BITMAP" || fmt === "BITMAP_SKIP_CONVERT";
    rcBtn.style.display = bitmap ? "none" : "";
    if (bitmap && isToolActive) deactivateTool({ restoreMode: true });
  });

  toolsLoop();

  // Prime the getPaper() cache before toolsLoop() marks the mode-selector as
  // seen — after that, waitForElement skips the existing element and getPaper()
  // would hang until the next DOM remount.
  addon.tab.traps.getPaper().catch(() => {});
}
