/**
 * TextToPath — converts a paper.js PointText item to a Path/CompoundPath.
 *
 * Strategy: rasterize the text at high resolution, trace the alpha-channel
 * boundary with marching squares, simplify the resulting polylines with
 * Ramer-Douglas-Peucker, and build paper.js path objects.
 *
 * No font-parsing library needed — the browser already knows how to render
 * the glyphs; we just read the pixels back.
 */
export default class TextToPath {
  // A pixel with alpha ≥ this value is treated as "inside" the glyph.
  // 128 puts the contour through the middle of the anti-aliased fringe.
  static #ALPHA = 128;

  // Ramer-Douglas-Peucker tolerance in raster pixels (fallback only).
  static #EPS = 0.8;

  // Overall target: longest canvas dimension for a single-line / roughly-square
  // text block. Ensures small and medium text always get fine-grained pixels
  // regardless of aspect ratio.
  static #TARGET_PX = 2400;

  // Per-line floor: minimum raster pixels for one line of text height.
  // Kicks in when the block is very wide with many lines — width would otherwise
  // dominate the overall target and leave each line under-resolved.
  // e.g. a 3-line paragraph 900 wide × 820 tall: overall gives 2400/900 = 2.7×,
  // per-line gives 800/273 = 2.9×; max(2.7, 2.9) = 2.9× ← per-line wins.
  static #TARGET_PX_PER_LINE = 800;

  // Hard cap on the longest canvas dimension to bound memory / rasterize time.
  static #MAX_CANVAS_PX = 4000;

  static #rasterScale(bounds, nLines) {
    const lineHeight = bounds.height / Math.max(nLines, 1);
    const maxDim = Math.max(bounds.width, bounds.height);
    // Take the BETTER (max) of the two quality targets:
    //   • overall: 2400px on the longest side  — protects single-line / small text
    //   • per-line: 800px per line height      — protects wide multi-line paragraphs
    // Then clamp to the hard canvas cap.
    const scaleQuality = Math.max(this.#TARGET_PX / maxDim, this.#TARGET_PX_PER_LINE / lineHeight);
    return Math.min(scaleQuality, this.#MAX_CANVAS_PX / maxDim);
  }

  // ── Marching squares lookup ─────────────────────────────────────────────
  // Index = (TL<<3)|(TR<<2)|(BR<<1)|BL  (1 = inside, 0 = outside)
  // Edges: 0 = top, 1 = right, 2 = bottom, 3 = left
  // Value: [edgeA, edgeB] pair, "S5"/"S10" for saddle cases, or null.
  static #MS = [
    null,
    [3, 2],
    [2, 1],
    [3, 1], // 0–3
    [0, 1],
    "S5",
    [0, 2],
    [3, 0], // 4–7
    [0, 3],
    [0, 2],
    "S10",
    [0, 1], // 8–11
    [1, 3],
    [1, 2],
    [2, 3],
    null, // 12–15
  ];

  // Each saddle case produces two independent segments.
  // S5  = 0101: TR+BL inside → [top↔right] and [bottom↔left]
  // S10 = 1010: TL+BR inside → [top↔left] and [bottom↔right]
  static #SAD = {
    S5: [
      [0, 1],
      [2, 3],
    ],
    S10: [
      [0, 3],
      [2, 1],
    ],
  };

  // Per exit-edge: [Δrow, Δcol, entry-edge-in-next-cell]
  static #MOV = [
    [-1, 0, 2], // 0 TOP    → move up,    enter via BOTTOM
    [0, 1, 3], // 1 RIGHT  → move right, enter via LEFT
    [1, 0, 0], // 2 BOTTOM → move down,  enter via TOP
    [0, -1, 1], // 3 LEFT   → move left,  enter via RIGHT
  ];

  /**
   * Convert a PointText item to a Path or CompoundPath.
   * The returned item is NOT inserted into the paper project — the caller
   * is responsible for positioning and inserting it.
   * Returns null if the text produces no traceable pixels.
   *
   * @param {paper.PointText} textItem
   * @param {object} paper  – the paper.js scope
   * @returns {paper.Path|paper.CompoundPath|null}
   */
  static convert(textItem, paper) {
    try {
      return this.#run(textItem, paper);
    } catch (e) {
      console.error("[TextToPath]", e);
      return null;
    }
  }

  static #run(textItem, paper) {
    // 1. Rasterize into an off-screen canvas ─────────────────────────────
    // Use drawnBounds (Scratch fork) so stroke/glow are included; fall back
    // to plain bounds. The call mirrors how scratch-paint does bitmap export.
    const bounds = textItem.drawnBounds ?? textItem.bounds;
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;

    // Count newlines so multi-line text is normalised to per-line resolution.
    const nLines = (textItem.content ?? "").split("\n").length;
    const scale = this.#rasterScale(bounds, nLines);
    const raster = textItem.rasterize(72 * scale, /* insert */ false, bounds);
    const canvas = raster.canvas;
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw < 2 || ch < 2) return null;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const data = ctx.getImageData(0, 0, cw, ch).data;

    // Coordinate mapping: pixel (px, py) → paper (ox + px/sx, oy + py/sy)
    // The canvas spans [bounds.x, bounds.x + bounds.width] × [...height]
    const ox = bounds.x,
      oy = bounds.y;
    const sx = cw / bounds.width,
      sy = ch / bounds.height;

    // 2. Binary grid: 1 = inside (alpha above threshold) ─────────────────
    const T = this.#ALPHA;
    const rawA = new Float32Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) rawA[i] = data[i * 4 + 3];

    const grid = new Uint8Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) grid[i] = rawA[i] >= T ? 1 : 0;

    // 3. Trace closed contours ────────────────────────────────────────────
    const contours = this.#trace(grid, cw, ch);
    if (!contours.length) return null;

    // 4. Build paper paths and fit bezier curves ──────────────────────────
    // Pre-smooth with a moving average to eliminate the ±0.5px staircase
    // zigzag on curved regions before bezier fitting.  Corner deviation is
    // many pixels so corners survive the window; staircase noise is gone.
    // Window is chosen to cover a consistent ~2.5 WORLD UNITS regardless of
    // raster scale, expressed as the nearest odd integer ≥ 3:
    //   sx=2.75 (large text) → win=7  (2.55wu), residual 1/7 =14% of 0.5px=0.071px
    //   sx=5.78 (normal)     → win=15 (2.60wu), residual 1/15= 6.7% =0.033px
    //   sx=7.62 (small text) → win=21 (2.76wu), residual 1/21= 4.8% =0.024px
    // A world-unit window is critical: at high scale the fixed 9-pt window
    // only covered 1.18wu, leaving enough residual raster variation that
    // simplify(0.5px) produced 25 bezier nodes for a single S-curve arc.
    // With a 2.5wu window that same arc simplifies to 8–12 nodes since all
    // sub-1wu raster wiggles are averaged away.  Genuine glyph features
    // (S-curve inflections, corner cusps, etc.) are >2.5wu and unaffected.
    const SMOOTH_WIN = Math.max(3, 2 * Math.round(1.25 * sx) + 1);
    const canSimplify = typeof paper.Path.prototype.simplify === "function";
    // Fixed 0.5 raster-pixel tolerance for simplify().
    // After 9-pt smoothing the staircase residual is ~0.056px — well below this
    // threshold — so noise is fully absorbed at any scale.  Using a world-unit
    // scaled tolerance (e.g. 0.15*sx) looked attractive for reducing segment
    // counts at high scale but merged real curve features (e.g. the inflection
    // midpoint of an S terminal at ~264wu with 1.15px tol at sx=7.62).
    // Segment count reduction comes from the scale-aware CORNER_SPAN above,
    // which better isolates arcs — not from loosening the curve-fit tolerance.
    const SIMPLIFY_TOL_PX = 0.5;

    const paths = [];
    const cornerCounts = [];
    for (const pts of contours) {
      if (pts.length < 3) continue;

      // Corner-preserving smooth in raster-pixel space.
      //
      // Problem: a plain moving average rounds 90° corners (e.g. top of T)
      // because it averages points from both sides of the turn.
      //
      // Solution:
      //   1. Detect corners by comparing the "incoming" direction (pts[i-SPAN]→pts[i])
      //      against the "outgoing" direction (pts[i]→pts[i+SPAN]).
      //      SPAN=5 makes the baseline 5 px wide — staircase noise deflects
      //      only ~6° over that span, so it never fires; real 90° corners do.
      //   2. Dilate the corner mask ±half points so the smooth window never
      //      reaches across the corner boundary.
      //   3. Apply the moving average only to unprotected (non-corner) points;
      //      keep corner-region points at their exact raw positions so that
      //      simplify() sees an accurate cusp there.
      const n = pts.length;
      const half = (SMOOTH_WIN - 1) >> 1;
      // Corner-detection baseline in raster pts, locked to ~1.8 world units so
      // the angular baseline stays consistent regardless of raster scale.
      // At sx=2.75 → 5 (floor); at sx=7.62 → 14.  Larger baseline at high
      // scale means shallow S-terminal angles that span >0.66 wu are no longer
      // missed because the measurement window was too narrow.
      const CORNER_SPAN = Math.max(5, Math.round(1.8 * sx));
      const CORNER_COS = 0.5; // cos(60°) — flag corners sharper than 60°

      // Compute the raw dot product at every point (lower = sharper corner).
      const cornerDot = new Float32Array(n).fill(1);
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - CORNER_SPAN + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + CORNER_SPAN) % n];
        const inDx = p1[0] - p0[0],
          inDy = p1[1] - p0[1];
        const outDx = p2[0] - p1[0],
          outDy = p2[1] - p1[1];
        const li = Math.hypot(inDx, inDy),
          lo = Math.hypot(outDx, outDy);
        if (li < 0.5 || lo < 0.5) continue;
        cornerDot[i] = (inDx * outDx + inDy * outDy) / (li * lo);
      }

      // Mark raw candidates below threshold, then cluster consecutive candidates
      // and keep only the single sharpest point in each cluster. This avoids
      // placing 3 split-points within 2px of each other at a raster corner.
      const cornerPeak = new Uint8Array(n);
      let nCorners = 0;
      {
        // Gather candidate indices
        const candidates = [];
        for (let i = 0; i < n; i++) if (cornerDot[i] < CORNER_COS) candidates.push(i);
        // Cluster: two candidates belong to the same cluster if they are within
        // CORNER_SPAN*2 steps of each other (wrapping around).
        const clusterGap = CORNER_SPAN * 2;
        let ci = 0;
        while (ci < candidates.length) {
          let cj = ci + 1;
          while (cj < candidates.length) {
            const gap = (candidates[cj] - candidates[cj - 1] + n) % n;
            if (gap <= clusterGap) cj++;
            else break;
          }
          // Also check wrap-around: if last and first candidate are close
          if (cj === candidates.length && ci > 0) {
            const wrapGap = (candidates[0] + n - candidates[candidates.length - 1]) % n;
            if (wrapGap <= clusterGap) {
              break;
            } // all one cluster — no corners
          }
          // Pick sharpest in this cluster
          let best = candidates[ci];
          for (let k = ci + 1; k < cj; k++) {
            if (cornerDot[candidates[k]] < cornerDot[best]) best = candidates[k];
          }
          cornerPeak[best] = 1;
          nCorners++;
          ci = cj;
        }
      }
      // Dilate: protect ±half neighbors so the smooth window stays within
      // each homogeneous region.
      const isProtected = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        if (cornerPeak[i]) {
          for (let j = -half; j <= half; j++) isProtected[(i + j + n) % n] = 1;
        }
      }
      const denoised = pts.map((p, i) => {
        if (isProtected[i]) return p; // preserve original position near corners
        let ax = 0,
          ay = 0;
        for (let j = -half; j <= half; j++) {
          const [x, y] = pts[(i + j + n) % n];
          ax += x;
          ay += y;
        }
        return [ax / SMOOTH_WIN, ay / SMOOTH_WIN];
      });

      // Indices of corner peaks within denoised[].
      const cornerIdxs = [];
      for (let i = 0; i < n; i++) if (cornerPeak[i]) cornerIdxs.push(i);

      let path;
      if (canSimplify && cornerIdxs.length >= 2) {
        // Split the contour at detected corners and simplify each arc
        // independently as an OPEN path. paper.js open-path simplify()
        // respects endpoints, so the corner vertices are never smoothed over.
        // Reassemble with zero-handle cusp nodes at every corner.
        const nc3 = cornerIdxs.length;

        // ── Correct corner positions ────────────────────────────────────────
        // Marching-squares injects exact grid vertices at 90° turns. These sit
        // at integer pixel coordinates, while the adjacent arm edge-midpoints
        // sit at half-integer coordinates — a systematic 0.5px offset.
        // Fix: sample the denoised contour well past the per-corner noise zone
        // on each side, estimate each arm's direction, and compute their
        // geometric intersection.  This gives the true corner regardless of
        // which direction the turn goes.
        //
        // We sample SAMPLE indices past the corner (skips the junction noise
        // and the dilation zone) and measure direction over WINDOW indices.
        // SAMPLE must exceed half (the dilation half-width) — otherwise we
        // would sample unsmoothed protected points and get noisy directions.
        const SAMPLE = half + 4; // half + a few extra pts clear of dilation
        const WINDOW = 4;
        const correctedCorner = cornerIdxs.map((ics) => {
          const outPts = [],
            inPts = [];
          for (let d = SAMPLE; d < SAMPLE + WINDOW; d++) outPts.push(denoised[(ics + d + n) % n]);
          for (let d = -(SAMPLE + WINDOW); d < -SAMPLE; d++) inPts.push(denoised[(ics + d + n) % n]);

          // Direction vectors (endpoint→endpoint over the window)
          const odx = outPts[WINDOW - 1][0] - outPts[0][0],
            ody = outPts[WINDOW - 1][1] - outPts[0][1];
          const idx = inPts[WINDOW - 1][0] - inPts[0][0],
            idy = inPts[WINDOW - 1][1] - inPts[0][1];
          const cross = idx * ody - idy * odx;
          if (Math.abs(cross) < 0.01) return null; // parallel → keep original
          const dx = outPts[0][0] - inPts[0][0],
            dy = outPts[0][1] - inPts[0][1];
          const t = (dx * ody - dy * odx) / cross;
          return [inPts[0][0] + idx * t, inPts[0][1] + idy * t];
        });

        // ── Build and simplify arcs ─────────────────────────────────────────
        // Skip the few noisy junction midpoints right next to each corner so
        // simplify() sees only the clean arm/curve run.  With corrected corner
        // positions the arm points are now perfectly collinear with start→end,
        // so even the fine tolerance collapses them to a straight line without
        // the hack of using a larger tolerance that over-simplifies curves.
        const CORNER_SKIP_PX = 1.5;
        const arcPaths = cornerIdxs.map((iStart, ci) => {
          const iEnd = cornerIdxs[(ci + 1) % nc3];
          const cs = correctedCorner[ci] ?? denoised[iStart];
          const ce = correctedCorner[(ci + 1) % nc3] ?? denoised[iEnd];

          const arcPts = [cs];
          let k = (iStart + 1) % n;
          const [csx, csy] = denoised[iStart];
          const [cex, cey] = denoised[iEnd];
          while (k !== iEnd) {
            const [px, py] = denoised[k];
            if (Math.hypot(px - csx, py - csy) >= CORNER_SKIP_PX) break;
            k = (k + 1) % n;
          }
          while (k !== iEnd) {
            const [px, py] = denoised[k];
            if (Math.hypot(px - cex, py - cey) < CORNER_SKIP_PX) break;
            arcPts.push(denoised[k]);
            k = (k + 1) % n;
          }
          arcPts.push(ce);

          // If all interior points are within tolerance of the start→end line,
          // this arc is straight — bypass simplify() entirely (yields exactly
          // 2 segments, zero handles, guaranteed straight line after offset).
          const [ax, ay] = cs,
            [bx, by] = ce;
          const abLen = Math.hypot(bx - ax, by - ay);
          let maxDev = 0;
          if (abLen > 0.01) {
            for (let j = 1; j < arcPts.length - 1; j++) {
              const [px, py] = arcPts[j];
              maxDev = Math.max(maxDev, Math.abs((px - ax) * (by - ay) - (py - ay) * (bx - ax)) / abLen);
            }
          }
          let arc;
          if (maxDev < SIMPLIFY_TOL_PX) {
            // Straight arm — no interior nodes needed.
            arc = new paper.Path([new paper.Point(ax, ay), new paper.Point(bx, by)]);
          } else {
            arc = new paper.Path(arcPts.map(([px, py]) => new paper.Point(px, py)));
            if (arcPts.length >= 3) arc.simplify(SIMPLIFY_TOL_PX);
          }
          return arc;
        });

        path = new paper.Path();
        for (let ci = 0; ci < nc3; ci++) {
          const arcSegs = arcPaths[ci].segments;
          const last = arcSegs.length - 1;
          // Corner: exact grid vertex, zero handles = true cusp.
          path.add(new paper.Segment(arcSegs[0].point.clone()));
          // Interior bezier segments from this arc's simplify.
          // simplify() sets arcSegs[1].handleIn to pair with arcSegs[0]'s
          // natural handleOut, but we forced that to zero — zero the orphaned
          // handle so the path is straight leaving the cusp. Same logic applies
          // to arcSegs[last-1].handleOut approaching the next cusp.
          for (let s = 1; s < last; s++) {
            const seg = arcSegs[s];
            const hi = s === 1 ? new paper.Point(0, 0) : seg.handleIn.clone();
            const ho = s === last - 1 ? new paper.Point(0, 0) : seg.handleOut.clone();
            path.add(new paper.Segment(seg.point.clone(), hi, ho));
          }
        }
        path.closed = true;
        for (const arc of arcPaths) arc.remove();
        path.transform(new paper.Matrix(1 / sx, 0, 0, 1 / sy, ox, oy));
      } else if (canSimplify) {
        // No corners (e.g. 'O') — simplify the whole closed path at once.
        path = new paper.Path(denoised.map(([px, py]) => new paper.Point(px, py)));
        path.closed = true;
        path.simplify(SIMPLIFY_TOL_PX);
        path.transform(new paper.Matrix(1 / sx, 0, 0, 1 / sy, ox, oy));
      } else {
        const simp = this.#rdp(denoised, this.#EPS);
        if (simp.length < 3) continue;
        path = new paper.Path(simp.map(([px, py]) => new paper.Point(ox + px / sx, oy + py / sy)));
        path.closed = true;
      }

      if (path.segments.length >= 3) {
        paths.push(path);
        cornerCounts.push(nCorners);
      } else path.remove();
    } // end for (const pts of contours)

    if (!paths.length) return null;
    if (paths.length === 1) return paths[0];
    return new paper.CompoundPath({ children: paths });
  }

  /**
   * Marching squares contour tracer.
   * Returns an array of polylines, each polyline being an array of [x, y]
   * points in raster-pixel space (floating-point edge midpoints).
   */
  static #trace(grid, w, h) {
    const gw = w - 1; // cell-grid columns
    const gh = h - 1; // cell-grid rows

    // One bit per segment per cell: bit 0 = segment 0, bit 1 = segment 1
    // (saddle cells have two independent segments).
    const vis = new Uint8Array(gw * gh);
    const contours = [];

    // 4-bit case for cell (r, c): corners TL, TR, BR, BL
    const cellCase = (r, c) =>
      (grid[r * w + c] << 3) |
      (grid[r * w + (c + 1)] << 2) |
      (grid[(r + 1) * w + (c + 1)] << 1) |
      grid[(r + 1) * w + c];

    // Segment list for a cell case
    const segsOf = (ci) => {
      const v = this.#MS[ci];
      if (!v) return [];
      if (typeof v === "string") return this.#SAD[v];
      return [v];
    };

    // Floating-point edge midpoint in raster-pixel space
    const edgePt = (r, c, e) => {
      if (e === 0) return [c + 0.5, r]; // top
      if (e === 1) return [c + 1, r + 0.5]; // right
      if (e === 2) return [c + 0.5, r + 1]; // bottom
      /* e===3 */ return [c, r + 0.5]; // left
    };

    for (let r0 = 0; r0 < gh; r0++) {
      for (let c0 = 0; c0 < gw; c0++) {
        const vi0 = r0 * gw + c0;
        const segs = segsOf(cellCase(r0, c0));

        for (let si = 0; si < segs.length; si++) {
          if (vis[vi0] & (1 << si)) continue; // this segment already traced

          // Walk the closed contour loop.
          // We pretend the start cell was entered via segs[si][1] (its second
          // edge), so the first exit will naturally be segs[si][0].
          const [startE0, startE1] = segs[si];
          const pts = [];
          let r = r0,
            c = c0,
            entry = startE1;
          const MAX = (gw * gh + 4) * 2; // safety upper bound

          for (let iter = 0; iter < MAX; iter++) {
            const vi = r * gw + c;
            const cs = segsOf(cellCase(r, c));

            // Find the segment that contains the entry edge
            let seg = null,
              bit = 0;
            for (let bi = 0; bi < cs.length; bi++) {
              if (cs[bi][0] === entry || cs[bi][1] === entry) {
                seg = cs[bi];
                bit = bi;
                break;
              }
            }
            if (!seg) break; // degenerate / disconnected

            vis[vi] |= 1 << bit;

            // Exit via the other edge of this segment
            const exit = seg[0] === entry ? seg[1] : seg[0];

            // Corner injection: when entry and exit are PERPENDICULAR edges
            // (odd sum), marching squares would otherwise connect their two
            // edge midpoints diagonally, cutting the exact corner vertex.
            // Insert the shared grid vertex between them so the corner is exact.
            // Edges: 0=top, 1=right, 2=bottom, 3=left.
            // Perpendicular pairs have an odd sum (0+1, 0+3, 1+2, 2+3, etc.).
            // Opposite pairs (0+2, 1+3) have even sums — no corner to insert.
            if ((entry + exit) % 2 === 1) {
              // The shared corner's X is c+1 if either edge is the right edge (1).
              // The shared corner's Y is r+1 if either edge is the bottom edge (2).
              const cx = entry === 1 || exit === 1 ? c + 1 : c;
              const cy = entry === 2 || exit === 2 ? r + 1 : r;
              pts.push([cx, cy]);
            }

            pts.push(edgePt(r, c, exit));

            // Step to the adjacent cell
            const [dr, dc, nextEntry] = this.#MOV[exit];
            r += dr;
            c += dc;
            entry = nextEntry;

            // Off-grid → open contour, stop here
            if (r < 0 || r >= gh || c < 0 || c >= gw) break;
            // Back at start with correct entry → loop closed
            if (r === r0 && c === c0 && entry === startE1) break;
          }

          if (pts.length >= 3) contours.push(pts);
        }
      }
    }

    return contours;
  }

  /**
   * Ramer-Douglas-Peucker polyline simplification.
   * epsilon is in the same units as the point coordinates.
   */
  static #rdp(pts, eps) {
    if (pts.length < 3) return pts;
    const [x1, y1] = pts[0];
    const [x2, y2] = pts[pts.length - 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    let maxD = 0,
      maxI = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i];
      // Standard point-to-line distance: |cross(AB, AP)| / |AB|.
      // If the two endpoints are the same point (len < 1e-10, i.e. far smaller
      // than a sub-pixel coordinate), the line direction is undefined and the
      // formula would divide by zero — fall back to distance from the start point.
      const d =
        len < 1e-10
          ? Math.hypot(px - x1, py - y1)
          : Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / len;
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > eps) {
      const L = this.#rdp(pts.slice(0, maxI + 1), eps);
      const R = this.#rdp(pts.slice(maxI), eps);
      return [...L.slice(0, -1), ...R];
    }
    return [pts[0], pts[pts.length - 1]];
  }
}
