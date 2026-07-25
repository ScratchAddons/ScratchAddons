export default async function ({ addon }) {
  addon.tab.redux.initialize();

  // ── Tool state ─────────────────────────────────────────────────────────
  // Corner rounding is a passive overlay on top of scratch-paint's native Reshape
  // tool: active whenever Reshape mode is selected on a vector costume. Reshape
  // keeps full ownership of canvas interaction (selecting shapes, dragging points/
  // handles, box-select); we only draw corner-rounding widgets on top of whatever
  // it has selected and let the user drag them directly.
  let paper = null;
  let corners = []; // CornerHandle[]
  let lastDraggedCorner = null; // rendered last (on top) in SVG z-order
  let activeDragCorner = null; // corner currently mid-drag — its widget tracks the cursor exactly
  let groupDragActive = false; // dragging with nothing explicitly selected — every corner moves together
  // paper.Path → Array<{x, y, hix, hiy, hox, hoy}>
  let pathSnapshots = new Map();
  let madeChanges = false;
  let overlayActive = false;

  // ── SVG overlay refs ───────────────────────────────────────────────────
  // The widget circles are DOM SVG elements sitting on top of the paper canvas,
  // never part of the paper project — so they can never leak into undo snapshots.
  let overlaySvg = null; // the <svg> DOM element
  let canvas = null; // the paper.js <canvas> element (coordinate conversion)
  let canvasContainer = null;

  // ── Constants ──────────────────────────────────────────────────────────
  // Handles shorter than this (in paper-space units) are treated as zero.
  const EPS = 0.5;
  // Minimum on-screen distance (px) between a corner's widget and its tip when at
  // rest — see widgetPt() below.
  const MIN_WIDGET_OFFSET_PX = 16;
  // Corner widget appearance, in screen pixels.
  const WIDGET_BLUE = "#388fe5";
  // Solid white halo behind the selected circle for contrast against busy
  // backgrounds, without darkening/muddying its pure blue fill. Unselected
  // widgets keep the original darker drop-shadow halo.
  const WIDGET_HALO_FILL_SELECTED = "white";
  const WIDGET_HALO_FILL_UNSELECTED = "rgba(0,0,0,0.12)";
  const WIDGET_RADIUS_SELECTED = 4;
  const WIDGET_HALO_RADIUS_SELECTED = 6;
  const WIDGET_RADIUS_UNSELECTED = 3.5;
  const WIDGET_HALO_RADIUS_UNSELECTED = 5;
  // Invisible hit target so clicks within this distance of any widget centre
  // register as a widget click rather than falling through to the canvas.
  const WIDGET_HIT_RADIUS = 8;

  // ── Math utilities ─────────────────────────────────────────────────────

  // Line–line intersection: returns the point where (p1 + t·d1) = (p2 + s·d2),
  // or null if the lines are parallel.
  const lineIntersect = (p1, d1, p2, d2) => {
    const det = -d1.x * d2.y + d2.x * d1.y;
    if (Math.abs(det) < 1e-10) return null;
    const t = (-(p2.x - p1.x) * d2.y + d2.x * (p2.y - p1.y)) / det;
    return new paper.Point(p1.x + t * d1.x, p1.y + t * d1.y);
  };

  // Estimate the local side direction near a sharp corner from adjacent curve
  // geometry. Sampling slightly away from the corner gives a better direction
  // for curved neighbors than using only the endpoint-to-endpoint chord.
  const probeSideDirection = (cornerPt, fallbackPt, curve, probeTs) => {
    if (curve) {
      for (const t of probeTs) {
        const probe = curve.getPointAtTime(t);
        if (!probe) continue;
        const v = probe.subtract(cornerPt);
        if (v.length > 0.01) return v.normalize();
      }
    }
    const fallback = fallbackPt.subtract(cornerPt);
    return fallback.length > 0.01 ? fallback.normalize() : null;
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
  //
  // At rest (not the corner actively being dragged), the widget is pushed out to a
  // minimum on-screen distance so it never sits exactly on top of the corner tip —
  // e.g. at radius 0. While a corner is being dragged it ignores that minimum and
  // tracks the exact radius-derived position so the cursor stays glued to it.
  //
  // That minimum is capped to the distance the corner's own maxRadius would place
  // it at — otherwise a corner with short adjacent edges would push its widget out
  // past the point it could ever actually be rounded to, making it look disconnected
  // from the shape.
  const widgetPt = (corner) => {
    const exactPt =
      corner.radius === 0
        ? corner.origCorner.clone()
        : corner.origCorner.add(corner.bisector.multiply(corner.radius / corner.sinHalfAngle));
    if (corner === activeDragCorner) return exactPt;
    const minDist = Math.min(MIN_WIDGET_OFFSET_PX / paper.view.zoom, corner.maxRadius / corner.sinHalfAngle);
    if (exactPt.subtract(corner.origCorner).length >= minDist) return exactPt;
    return corner.origCorner.add(corner.bisector.multiply(minDist));
  };

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
    const inAlign = inDir.dot(A.handleOut.normalize());
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
    const outAlign = outDir.dot(B.handleIn.multiply(-1).normalize());
    if (inAlign >= 0.85 && outAlign >= 0.85) return true;

    // Fallback for curved-neighbor joins: detect the specific arc signature that
    // this addon emits, without broadly matching arbitrary bezier transitions.
    const h1 = A.handleOut.length;
    const h2 = B.handleIn.length;
    const hRatio = h1 / h2;
    if (hRatio < 0.3 || hRatio > 3.5) return false;

    const dirA = A.handleOut.normalize();
    const dirB = B.handleIn.normalize();
    const reconstructedCorner = lineIntersect(A.point, dirA, B.point, dirB);
    if (!reconstructedCorner) return false;

    const d1 = A.point.subtract(reconstructedCorner).length;
    const d2 = B.point.subtract(reconstructedCorner).length;
    if (d1 < 0.1 || d2 < 0.1) return false;

    // Reject only almost perfectly straight joins; curved-neighbor corners can
    // still have very shallow angles and must remain editable after commit.
    if (dirA.dot(dirB) < -0.995) return false;

    const relDiff = Math.abs(d1 - d2) / Math.max(d1, d2);
    if (relDiff > 0.75) return false;

    return true;
  };

  // Build a CornerHandle for a sharp corner at segment index i.
  const buildSharpCorner = (pathItem, i) => {
    const segs = pathItem.segments;
    const n = segs.length;
    const seg = segs[i];
    const prev = segs[(i - 1 + n) % n];
    const next = segs[(i + 1) % n];
    const incomingCurve = prev.curve;
    const outgoingCurve = seg.curve;
    const prevLen = incomingCurve?.length ?? prev.point.subtract(seg.point).length;
    const nextLen = outgoingCurve?.length ?? next.point.subtract(seg.point).length;
    if (prevLen < 0.01 || nextLen < 0.01) return null;
    const vPrev = probeSideDirection(seg.point, prev.point, incomingCurve, [0.9, 0.75, 0.6]);
    const vNext = probeSideDirection(seg.point, next.point, outgoingCurve, [0.1, 0.25, 0.4]);
    if (!vPrev || !vNext) return null;
    // vPrev/vNext point from the corner tip back toward the previous/next points.
    // dot ≈ +1 is an extremely sharp spike/cusp (the path folds back on itself) —
    // its maxRadius collapses to ~0 anyway, so there's nothing meaningful to round.
    // dot ≈ -1 means the two edges continue in the same straight line through this
    // point — it isn't a corner at all, and the bisector (vPrev + vNext) degenerates
    // to a near-zero vector there, which would collapse the widget onto the path.
    if (vPrev.dot(vNext) > 0.98 || vPrev.dot(vNext) < -0.98) return null;
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
      startRadius: 0,
      selected: false,
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
    // Preferred reconstruction for addon-created arc pairs: both A.handleOut and
    // B.handleIn point toward the original sharp corner tip. This is robust even
    // when neighboring segments are curved or also rounded.
    if (A.handleOut.length > EPS && B.handleIn.length > EPS) {
      const dirA = A.handleOut.normalize();
      const dirB = B.handleIn.normalize();
      const origFromHandles = lineIntersect(A.point, dirA, B.point, dirB);
      if (origFromHandles) {
        const vPrevFromHandles = dirA.multiply(-1);
        const vNextFromHandles = dirB.multiply(-1);
        const dot = vPrevFromHandles.dot(vNextFromHandles);
        if (dot <= 0.98 && dot >= -0.98) {
          const alpha = Math.acos(Math.max(-1, Math.min(1, dot)));
          const sinHalfAngle = Math.sin(alpha / 2);
          const tanHalfAngle = Math.tan(alpha / 2);
          const d = A.point.subtract(origFromHandles).length;
          if (d >= 0.1 && tanHalfAngle > 1e-6) {
            const r = d * tanHalfAngle;
            const prevLen = prev.point.subtract(origFromHandles).length;
            const nextLen = next.point.subtract(origFromHandles).length;
            return {
              pathItem,
              segIndex: i,
              isArc: true,
              origCorner: origFromHandles,
              radius: r,
              maxRadius: Math.min(prevLen, nextLen) * tanHalfAngle,
              startRadius: r,
              selected: false,
              bisector: vPrevFromHandles.add(vNextFromHandles).normalize(),
              vPrev: vPrevFromHandles,
              vNext: vNextFromHandles,
              sinHalfAngle,
              tanHalfAngle,
            };
          }
        }
      }
    }

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
    // See buildSharpCorner for why both the spike (dot ≈ +1) and colinear
    // (dot ≈ -1) cases are rejected here.
    if (vPrev.dot(vNext) > 0.98 || vPrev.dot(vNext) < -0.98) return null;
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
      startRadius: r,
      selected: false,
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
        // If any point on this path is natively selected in Reshape (paper.js
        // segment.selected), only show corners at those points — matching
        // Reshape's own convention of showing point handles just for points
        // you've actually selected. But if the shape is selected as a whole
        // with no individual points selected yet, behave as if every corner
        // were selected (there's nothing more specific to narrow down to).
        const anyNodeSelected = path.segments.some((s) => s.selected);
        // For open paths, endpoints (0 and n-1) have only one adjacent edge so skip them.
        const cornerStart = closed ? 0 : 1;
        const cornerEnd = closed ? n : n - 1;
        const pathCornersAll = [];
        const pathCornersSelected = [];
        for (let i = cornerStart; i < cornerEnd; i++) {
          if (arcStarts.has(i)) {
            const c = buildArcCorner(path, i);
            if (c) {
              pathCornersAll.push(c);
              if (!anyNodeSelected || path.segments[i].selected || path.segments[(i + 1) % n].selected) {
                pathCornersSelected.push(c);
              }
            }
          } else if (!arcUsed.has(i) && isSharp(path.segments[i])) {
            const c = buildSharpCorner(path, i);
            if (c) {
              pathCornersAll.push(c);
              if (!anyNodeSelected || path.segments[i].selected) {
                pathCornersSelected.push(c);
              }
            }
          }
        }

        if (anyNodeSelected && pathCornersSelected.length > 0) {
          corners.push(...pathCornersSelected);
        } else {
          // No nodes selected, or selected nodes are not roundable corners:
          // show all corners for the path.
          corners.push(...pathCornersAll);
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
      selected: s.selected,
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
      path.segments[i].selected = !!s.selected;
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
        const aSeg = pathItem.segments[corner.segIndex];
        const bSeg = pathItem.segments[corner.segIndex + 1];
        const mergedWasSelected = !!aSeg?.selected || !!bSeg?.selected;
        pathItem.segments[corner.segIndex].point = corner.origCorner.clone();
        pathItem.segments[corner.segIndex].handleIn = new paper.Point(0, 0);
        pathItem.segments[corner.segIndex].handleOut = new paper.Point(0, 0);
        pathItem.segments[corner.segIndex].selected = mergedWasSelected;
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
      const originalWasSelected = pathItem.segments[corner.segIndex].selected;
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
      pathItem.segments[corner.segIndex + 1].selected = originalWasSelected;
      pathItem.segments[corner.segIndex].point = P1;
      pathItem.segments[corner.segIndex].handleIn = new paper.Point(0, 0);
      // handleOut points back toward the corner tip → convex arc
      pathItem.segments[corner.segIndex].handleOut = corner.vPrev.multiply(-h);
      pathItem.segments[corner.segIndex].selected = originalWasSelected;
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
  // overflow:hidden clips widgets to the visible canvas area — scratch-paint's own
  // .canvas-container is overflow:visible, so without this, panning a corner off
  // the edge of the canvas leaves its widget rendered on top of the mode-selector
  // / color-picker panels instead of disappearing along with the shape.
  const buildOverlaySvg = () => {
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:10";
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

    // While a drag is in progress, hide every handle except the one actually
    // being dragged so stationary handles don't clutter the view — they
    // reappear once the mouse is released.
    const visibleCorners = activeDragCorner ? corners.filter((c) => c === activeDragCorner) : corners;

    // Render lastDraggedCorner last so it sits on top in SVG z-order.
    // This ensures the user always grabs the most-recently-touched handle
    // when handles overlap at maximum rounding.
    const orderedCorners =
      lastDraggedCorner && visibleCorners.includes(lastDraggedCorner)
        ? [...visibleCorners.filter((c) => c !== lastDraggedCorner), lastDraggedCorner]
        : visibleCorners;

    for (const corner of orderedCorners) {
      const { x, y } = toSVG(widgetPt(corner));
      const g = document.createElementNS(svgNS, "g");
      g.style.cssText = "pointer-events:all;cursor:pointer";
      moveTo(g, x, y);

      // Drop-shadow ring, then main circle — matching Adobe-style anchor points
      // but in Scratch's blue. Selected: solid blue circle. Unselected: plain
      // white circle with a thin blue outline.
      // While a group drag is in progress (nothing was explicitly selected, so every
      // corner is moving together) every widget renders with the selected style too.
      if (corner.selected || groupDragActive) {
        g.appendChild(svgEl("circle", { r: WIDGET_HALO_RADIUS_SELECTED, fill: WIDGET_HALO_FILL_SELECTED }));
        g.appendChild(svgEl("circle", { r: WIDGET_RADIUS_SELECTED, fill: WIDGET_BLUE }));
      } else {
        g.appendChild(svgEl("circle", { r: WIDGET_HALO_RADIUS_UNSELECTED, fill: WIDGET_HALO_FILL_UNSELECTED }));
        g.appendChild(
          svgEl("circle", { r: WIDGET_RADIUS_UNSELECTED, fill: "white", stroke: WIDGET_BLUE, "stroke-width": 1.5 })
        );
      }
      // Enlarged invisible hit target so clicks within WIDGET_HIT_RADIUS of any
      // widget centre register as a widget click rather than falling through to
      // the canvas.
      g.appendChild(svgEl("circle", { r: WIDGET_HIT_RADIUS, fill: "transparent" }));

      // ── Drag handling ─────────────────────────────────────────────────
      // The <g> element sits above the canvas (pointer-events:all), so SVG
      // mousedown stops the event reaching paper.js entirely — no shared flag needed.
      g.addEventListener("mousedown", (e) => {
        if (addon.self.disabled) return;
        e.stopPropagation();
        e.preventDefault();

        // The hit circle is WIDGET_HIT_RADIUS and handles may overlap, so find
        // whichever corner centre is closest to the click — that is the one the
        // user intended to target.
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

        // Remember whether this corner was already selected before the click.
        // Dragging an already-selected corner keeps the existing (possibly multi-)
        // selection moving together; dragging an unselected corner — regardless of
        // what else happens to be selected — shapes every corner together instead,
        // since there's nothing meaningful to narrow a fresh single-corner drag to.
        // Shift-click is the only way to build/adjust an explicit multi-selection.
        const wasSelected = activeCorner.selected;
        lastDraggedCorner = activeCorner;

        if (e.shiftKey) {
          activeCorner.selected = !activeCorner.selected;
        }
        // Otherwise, leave selection untouched for now — the drag/click outcome
        // below (dragAll, and the pure-click branch in onUp) decides it, so there's
        // no old selection left behind either way once this gesture finishes.

        const dragCorner = activeCorner; // closed over for this drag
        const dragAll = !e.shiftKey && !wasSelected;
        let didDrag = false;

        // Snapshot each affected corner's radius at drag start so, once dragging,
        // every affected corner moves by the same delta as dragCorner — preserving
        // each corner's individual rounding instead of snapping them all to the
        // same absolute radius.
        for (const c of corners) c.startRadius = c.radius;

        // ── Pre-scan: cap maxRadius to prevent arc overlap on shared segments ──
        // When two adjacent affected corners both expand, their tangent points
        // travel toward each other along the shared segment.  Equal split:
        // each gets at most half the original shared edge as tangent distance.
        //
        // Key: use (B.origCorner - A.origCorner)·A.vNext as the available length.
        // This is based on the stable reconstructed corner tips, so it gives the
        // correct original edge length even after the path has already been rounded
        // and re-scanned (unlike the distance to the current, already-shrunk segment
        // point, which would keep shrinking every time this corner is re-applied).
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
              if (!(dragAll || A.selected) || !(dragAll || B.selected)) continue;
              // Only constrain corners that actually face each other on the
              // same connecting edge. Consecutive entries in `pc` are not always
              // edge-adjacent when non-corner/curved vertices exist between them.
              const edgeVec = B.origCorner.subtract(A.origCorner);
              const totalAvailable = edgeVec.length;
              if (totalAvailable <= 0.1) continue;
              const edgeDir = edgeVec.normalize();
              if (edgeDir.dot(A.vNext) < 0.98) continue;
              if (edgeDir.dot(B.vPrev.multiply(-1)) < 0.98) continue;
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
          activeDragCorner = dragCorner;
          groupDragActive = dragAll;
          const pt = toProject(ev.clientX, ev.clientY);
          // Direct mapping: project the mouse position onto the bisector from the
          // corner tip.  That projection distance equals r/sin(α/2) when the mouse
          // is exactly at the circle centre, so r = projection * sin(α/2).
          // This means the cursor is always at the circle centre — a 1:1 feel.
          const projected = pt.subtract(dragCorner.origCorner).dot(dragCorner.bisector);
          const rDragged = Math.max(0, Math.min(projected * dragCorner.sinHalfAngle, dragCorner.maxRadius));
          // Apply the same delta (relative to each corner's own radius at drag start)
          // to every other affected corner, capped at each corner's own maximum.
          const delta = rDragged - dragCorner.startRadius;
          for (const c of corners) {
            if (!dragAll && !c.selected) continue;
            c.radius = Math.max(0, Math.min(c.startRadius + delta, c.maxRadius));
          }
          reapplyAll();
          madeChanges = true;
          drawWidgets();
          paper.view.update();
        };

        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          activeDragCorner = null;
          groupDragActive = false;
          // Restore the unconstrained maxRadius values (constraints were only
          // needed during this drag to prevent arc overlap).
          corners.forEach((c, i) => (c.maxRadius = savedMaxRadius[i]));
          if (!didDrag && !e.shiftKey) {
            // Pure click (no drag): select just this corner, whether it was
            // already selected (narrowing a multi-selection) or not (starting
            // a fresh one), so a following drag targets only it.
            for (const c of corners) c.selected = false;
            activeCorner.selected = true;
            drawWidgets();
          }
          if (didDrag && madeChanges) {
            triggerUpdateImage();
            if (dragAll) {
              // A group-drag doesn't leave any explicit selection behind.
              scanCorners();
            } else {
              // Rescan from the committed geometry so segIndex values stay valid,
              // keeping whichever corners were selected (matched by original tip
              // position, since segIndex may have shifted).
              const prevSel = corners.filter((c) => c.selected).map((c) => c.origCorner.clone());
              scanCorners();
              for (const c of corners) {
                c.selected = prevSel.some((pt) => pt.isClose(c.origCorner, 1.0));
              }
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
    const el = document.querySelector("[class*='paint-editor_canvas-container_']");
    if (!el) return;
    let fiber = el[addon.tab.traps.getInternalKey(el)];
    while (fiber && typeof fiber.stateNode?.handleUpdateImage !== "function") fiber = fiber.return;
    if (typeof fiber?.stateNode?.handleUpdateImage === "function") fiber.stateNode.handleUpdateImage();
  };

  // ── Tool lifecycle ─────────────────────────────────────────────────────
  // Corner rounding is purely a passive overlay on scratch-paint's native
  // Reshape tool — there is no separate mode or toolbar button. It starts
  // whenever Reshape mode is selected on a vector costume, and stops when
  // Reshape is exited, the format switches to bitmap, or the addon is disabled.

  const isBitmapFormat = () => {
    const fmt = addon.tab.redux.state?.scratchPaint?.format ?? "";
    return fmt === "BITMAP" || fmt === "BITMAP_SKIP_CONVERT";
  };

  const resetOverlayState = () => {
    // DOM SVG never touches the paper project, so no pre-clear needed before
    // triggerUpdateImage() — this is the key advantage over the old layer approach.
    if (madeChanges) triggerUpdateImage();
    madeChanges = false;
    // Hide (not remove) the SVG so it can be reused next activation.
    while (overlaySvg.firstChild) overlaySvg.removeChild(overlaySvg.firstChild);
    overlaySvg.style.display = "none";
    corners = [];
    lastDraggedCorner = null;
    activeDragCorner = null;
    groupDragActive = false;
    pathSnapshots = new Map();
  };

  // Reposition widgets when the user zooms or pans (paper.view.matrix changes).
  // Mirrors the same rAF pattern used by paint-gradient-editor.
  const startViewSyncLoop = () => {
    let lastViewKey = "";
    const loop = () => {
      if (!overlayActive) return;
      const m = paper.view.matrix;
      const viewKey = `${m.a.toFixed(3)},${m.tx.toFixed(1)},${m.ty.toFixed(1)}`;
      if (viewKey !== lastViewKey) {
        lastViewKey = viewKey;
        drawWidgets();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // Rescan corners for whatever is currently selected, keeping selection state
  // for corners that still exist (matched by original tip position).
  const rescanKeepingSelection = () => {
    const prevSel = corners.filter((c) => c.selected).map((c) => c.origCorner.clone());
    scanCorners();
    for (const c of corners) {
      c.selected = prevSel.some((pt) => pt.isClose(c.origCorner, 1.0));
    }
    takeSnapshots();
    drawWidgets();
  };

  // Hide the overlay the moment the user interacts directly with the canvas
  // (Reshape's own point/handle/whole-shape dragging) and only rescan + reveal
  // it again once they release the mouse. Neither of those native drags
  // dispatches a redux action, so there's no event to resync against mid-drag —
  // polling every frame caused visible selection-state flicker, so instead we
  // go hidden-and-stale for the duration of the gesture rather than fight it,
  // then resync once in a single clean redraw on release.
  const handleCanvasMouseDown = () => {
    overlaySvg.style.display = "none";
    const onRelease = () => {
      document.removeEventListener("mouseup", onRelease);
      if (!overlayActive) return;
      rescanKeepingSelection();
      overlaySvg.style.display = "";
    };
    document.addEventListener("mouseup", onRelease);
  };

  const startOverlay = async () => {
    if (overlayActive || addon.self.disabled || isBitmapFormat()) return;

    paper = await addon.tab.traps.getPaper();
    if (!paper) return;
    canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    canvas = canvasContainer?.querySelector("canvas");
    if (!canvasContainer || !canvas) return;

    // Bail if the mode changed again while we were awaiting getPaper().
    if (addon.tab.redux.state?.scratchPaint?.mode !== "RESHAPE") return;

    overlayActive = true;
    scanCorners();
    takeSnapshots();
    if (!overlaySvg || !canvasContainer.contains(overlaySvg)) {
      overlaySvg = buildOverlaySvg();
    }
    overlaySvg.style.display = "";
    drawWidgets();
    canvas.addEventListener("mousedown", handleCanvasMouseDown);
    startViewSyncLoop();
  };

  const stopOverlay = () => {
    if (!overlayActive) return;
    if (canvas) canvas.removeEventListener("mousedown", handleCanvasMouseDown);
    resetOverlayState();
    overlayActive = false;
  };

  // ── Redux listener ──────────────────────────────────────────────────────
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    const type = detail.action?.type;
    if (type === "scratch-paint/modes/CHANGE_MODE") {
      if (detail.action.mode === "RESHAPE") {
        startOverlay();
      } else if (overlayActive) {
        stopOverlay();
      }
    } else if (type === "scratch-gui/navigation/ACTIVATE_TAB") {
      const newTab = addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex ?? -1;
      if (newTab !== 1) {
        // Switching away from the costumes tab — tear down now while the paint
        // editor is still alive (triggerUpdateImage() needs it).
        if (overlayActive) stopOverlay();
      } else if (addon.tab.redux.state?.scratchPaint?.mode === "RESHAPE") {
        // Returning to the costumes tab with Reshape mode still selected
        // (Reshape mode persists across tab switches) — resume the overlay.
        startOverlay();
      }
    } else if (type === "scratch-paint/undo/UNDO" || type === "scratch-paint/undo/REDO") {
      // scratch-paint's _restore() reimports the paper project from JSON.
      // The SVG overlay is DOM-only so it survives untouched.
      // Wait one frame for paper.js to finish restoring, then rescan.
      if (!overlayActive) return;
      requestAnimationFrame(() => {
        if (!overlayActive) return;
        madeChanges = false;
        rescanKeepingSelection();
      });
    } else if (type === "scratch-paint/select/CHANGE_SELECTED_ITEMS") {
      // Skip while a corner widget is being interactively dragged so we don't
      // clobber the in-progress drag's corner state.
      if (!overlayActive || activeDragCorner) return;
      // A shape-selection change (different shape, or shape added/removed from
      // a multi-select) always starts fresh with every corner deselected —
      // scanCorners() already defaults every corner to unselected.
      scanCorners();
      takeSnapshots();
      drawWidgets();
    } else if (type === "scratch-paint/formats/CHANGE_FORMAT") {
      // Convert to Bitmap / Convert to Vector — corner rounding only works on
      // vector paths.
      if (isBitmapFormat() && overlayActive) stopOverlay();
    }
  });

  addon.self.addEventListener("disabled", () => stopOverlay());

  // Resume automatically if the addon loads (or is enabled) while Reshape is
  // already the active mode.
  if (addon.tab.redux.state?.scratchPaint?.mode === "RESHAPE") startOverlay();
}
