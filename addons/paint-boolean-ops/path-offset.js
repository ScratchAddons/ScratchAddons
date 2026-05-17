/**
 * PathOffset — expands a paper.js Path/CompoundPath outline outward by a
 * given distance, using pure vector math.
 *
 * Algorithm (per segment):
 *   1. Normalise winding — CCW outer paths / CW holes — so getNormalAtTime()
 *      consistently yields outward-pointing normals regardless of how the
 *      path was originally drawn.
 *   2. For each anchor, average the incoming and outgoing curve normals to
 *      get the miter bisector, then apply a miter-length correction so the
 *      offset distance from both adjacent edges equals `amount`.
 *      The miter is capped at 4× to prevent spikes at acute angles.
 *   3. Move the anchor along the bisector by `amount` world units.
 *   4. Keep bezier handles unchanged — exact for lines, good approximation
 *      for curves when offset is small relative to curve radius.
 *
 * Direction convention (paper.js, Y-down screen space):
 *   getNormalAtTime(t) = tangent.rotate(-90°) → maps (x,y)→(y,−x).
 *   CW paths  (screen) → normals point OUTWARD → +amount expands. ✓
 *   CCW holes (screen) → normals point INWARD  → +amount shrinks the hole
 *                        (correct: expanding the compound shape overall).
 */
export default class PathOffset {
  // Maximum miter multiplier — caps spikes at corners sharper than ~76°.
  static #MAX_MITER = 4;

  /**
   * Expand item's outline outward by `amount` world units.
   * Returns a new unstyled Path/CompoundPath (not inserted), or null.
   * The caller is responsible for copying styles and inserting/replacing.
   *
   * @param {paper.Item} item   – Path, CompoundPath, or Group
   * @param {number} amount     – world units (must be positive)
   * @param {object} paper      – the paper.js scope
   * @returns {paper.Path|paper.CompoundPath|null}
   */
  static offset(item, amount, paper) {
    if (!amount || amount <= 0) return null;
    try {
      return this.#run(item, amount, paper);
    } catch (e) {
      console.error("[PathOffset]", e);
      return null;
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  static #run(item, amount, paper) {
    if (item instanceof paper.CompoundPath) {
      const clone = item.clone();
      // Normalise winding: outer paths → CW (normals outward), holes → CCW.
      // reorient(nonZero=true, clockwise=true) makes the outermost path CW
      // and alternating inner paths CCW, matching the non-zero fill rule.
      if (typeof clone.reorient === "function") clone.reorient(true, true);
      const newChildren = clone.children.map((child) => this.#offsetOnePath(child, amount, paper)).filter(Boolean);
      clone.remove();
      if (!newChildren.length) return null;
      if (newChildren.length === 1) return this.#clean(newChildren[0]);
      return this.#clean(new paper.CompoundPath({ children: newChildren }));
    }

    if (item instanceof paper.Group) {
      const newChildren = item.children.map((child) => this.#run(child, amount, paper)).filter(Boolean);
      if (!newChildren.length) return null;
      if (newChildren.length === 1) return newChildren[0];
      return new paper.Group(newChildren);
    }

    if (item instanceof paper.Path) {
      // Force CW so getNormalAtTime consistently points outward (Y-down space).
      // Setting clockwise=true reverses path direction if needed.
      const clone = item.clone();
      clone.clockwise = true;
      const result = this.#offsetOnePath(clone, amount, paper);
      clone.remove();
      if (!result) return null;
      return this.#clean(result);
    }

    return null;
  }

  /**
   * Resolve self-intersecting loops caused by concave corners expanding into
   * each other. Uniting a path with an identical clone forces paper.js's
   * Clipper-based boolean engine to find every self-crossing and remove the
   * regions where the winding cancels out.
   */
  static #clean(result) {
    try {
      const dup = result.clone();
      const cleaned = result.unite(dup);
      dup.remove();
      result.remove();
      return cleaned;
    } catch {
      // paper.js intersection engine can crash on near-degenerate segments;
      // return the unclean result rather than null so the user still gets output.
      return result;
    }
  }

  /**
   * Offset a single Path by moving each anchor along the miter bisector of
   * its two adjacent curve normals. Handles are scaled proportionally to the
   * anchor's displacement from the path's centre so that circular shapes
   * remain circular rather than becoming diamond-like.
   */
  static #offsetOnePath(path, amount, paper) {
    const segs = path.segments;
    const n = segs.length;
    if (n === 0) return null;

    const curves = path.curves;
    const nc = curves.length; // n for closed paths, n-1 for open paths
    const centroid = path.bounds.center; // reference point for handle scaling

    const newSegs = segs.map((seg, i) => {
      const hasPrev = path.closed ? true : i > 0;
      const hasNext = path.closed ? true : i < nc;

      const prevCurve = hasPrev ? curves[(i - 1 + nc) % nc] : null;
      const nextCurve = hasNext ? curves[i] : null;

      let bisector;
      if (prevCurve && nextCurve) {
        const n1 = prevCurve.getNormalAtTime(1); // normal at end of incoming curve
        const n2 = nextCurve.getNormalAtTime(0); // normal at start of outgoing curve

        const sum = n1.add(n2);
        const len = sum.length;

        if (len < 0.01) {
          // Anti-parallel normals (180° turn) — use outgoing normal.
          bisector = n2.clone();
        } else {
          bisector = sum.divide(len); // normalise
          // Miter correction: scale so the offset distance from both edges
          // equals `amount`. cos(half-angle) = n2 · bisector.
          const cosHalf = n2.dot(bisector);
          if (Math.abs(cosHalf) > 0.01) {
            bisector = bisector.multiply(Math.min(1 / cosHalf, this.#MAX_MITER));
          }
        }
      } else if (nextCurve) {
        bisector = nextCurve.getNormalAtTime(0); // open path start
      } else if (prevCurve) {
        bisector = prevCurve.getNormalAtTime(1); // open path end
      } else {
        bisector = new paper.Point(0, 0); // degenerate
      }

      const newPt = seg.point.add(bisector.multiply(amount));

      // Scale handles so curves stay proportionally correct after offsetting.
      // Ratio of new vs old anchor distance from the path centre approximates
      // the local radius growth — exact for circles, good for general shapes.
      const oldDist = seg.point.subtract(centroid).length;
      const newDist = newPt.subtract(centroid).length;
      const scale = oldDist > 0.01 ? newDist / oldDist : 1;

      return new paper.Segment(newPt, seg.handleIn.multiply(scale), seg.handleOut.multiply(scale));
    });

    // Discard segments whose new point is within 0.1 units of the previous
    // segment's new point — paper.js's intersection engine can crash on
    // zero-length or near-zero-length curves.
    const MIN_SEG_DIST = 0.1;
    const filtered = path.closed
      ? newSegs.filter((seg, i) => {
          const prev = newSegs[(i - 1 + newSegs.length) % newSegs.length];
          return seg.point.subtract(prev.point).length >= MIN_SEG_DIST;
        })
      : newSegs; // open paths: keep all endpoints to preserve shape

    if (filtered.length < 2) return null;
    return new paper.Path({ segments: filtered, closed: path.closed });
  }
}
