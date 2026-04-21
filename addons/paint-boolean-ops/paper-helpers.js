import TextToPath from "./text-to-path.js";
import PathOffset from "./path-offset.js";

// ── Degenerate detection ───────────────────────────────────────────────
// Returns true if the path/compound-path is degenerate (zero-area sliver,
// single-point artefact, etc.) and should be discarded.
const isDegenerate = (r) => {
  if (!r) return true;
  if (r.children) {
    // CompoundPath: degenerate if every child is degenerate.
    return r.children.length === 0 || r.children.every(isDegenerate);
  }
  // Path: must have ≥ 3 segments and meaningful area.
  if (!r.segments || r.segments.length < 3) return true;
  if (Math.abs(r.area) < 1) return true;
  return false;
};

// Strips degenerate children from a CompoundPath in-place, then removes r
// and returns null if the whole result is degenerate, otherwise returns r.
export const cleanResult = (r) => {
  if (!r) return null;
  if (r.children) {
    for (const child of r.children.slice()) {
      if (isDegenerate(child)) child.remove();
    }
    // Unwrap a single-child CompoundPath to a plain Path.
    if (r.children.length === 1) r = r.reduce();
  }
  if (isDegenerate(r)) {
    r.remove();
    return null;
  }
  return r;
};

// ── Style helpers ──────────────────────────────────────────────────────
// paper.js boolean ops reliably corrupt/lose item styles, so we snapshot
// before ops and restore after via these two helpers.
export const cloneStyle = (src) => ({
  fillColor: src.fillColor ? src.fillColor.clone() : null,
  strokeColor: src.strokeColor ? src.strokeColor.clone() : null,
  strokeWidth: src.strokeWidth,
});

export const applyStyle = (dst, style) => {
  dst.fillColor = style.fillColor;
  dst.strokeColor = style.strokeColor;
  dst.strokeWidth = style.strokeWidth;
};

// ── Path normalisation ─────────────────────────────────────────────────
// Normalise paths before boolean ops. Scratch sometimes stores circles as
// open paths whose last segment coincides with the first — paper.js boolean
// ops treat open paths differently, producing corrupt results. Convert these
// to proper closed paths by transferring the last segment's handleIn to the
// first (preserving the closing arc's tangent) then removing the duplicate.
export const preprocessPaths = (items, paper) => {
  for (const item of items) {
    if (!(item instanceof paper.Path || item instanceof paper.CompoundPath)) continue;
    const paths = item instanceof paper.CompoundPath ? item.children.slice() : [item];
    for (const path of paths) {
      if (!path.closed && path.segments.length >= 2) {
        const first = path.segments[0];
        const last = path.segments[path.segments.length - 1];
        if (first.point.getDistance(last.point) < 0.01) {
          first.handleIn = last.handleIn;
          last.remove();
          path.closed = true;
        }
      }
    }
  }
};

// Removes consecutive segments that are at the same position (< 0.01 px apart).
// These zero-length edges cause PathOffset to produce degenerate / jagged output.
const mergeDuplicateSegments = (item, paper) => {
  const paths = item instanceof paper.CompoundPath ? item.children.slice() : item instanceof paper.Path ? [item] : [];
  for (const path of paths) {
    for (let i = path.segments.length - 1; i >= 1; i--) {
      if (path.segments[i].point.getDistance(path.segments[i - 1].point) < 0.01) {
        path.segments[i - 1].handleOut = path.segments[i].handleOut;
        path.segments[i].remove();
      }
    }
  }
};

// ── Selection helpers ──────────────────────────────────────────────────
// Returns the selected painting-layer closed paths/compounds sorted back→front.
// Includes Scratch's pseudo-open circles (first point ≈ last point).
export const getPaintingSelected = (paper) =>
  paper.project.selectedItems
    .filter(
      (item) =>
        item.layer?.data?.isPaintingLayer &&
        // Exclude child paths of a CompoundPath — when a CompoundPath is
        // selected, paper.js also puts all its child Paths into selectedItems.
        // Including them causes unite to operate on sub-paths individually,
        // destroying holes and ultimately erasing the shape entirely.
        !(item instanceof paper.Path && item.parent instanceof paper.CompoundPath) &&
        ((item instanceof paper.Path &&
          (item.closed ||
            (item.segments.length >= 2 &&
              item.segments[0].point.getDistance(item.segments[item.segments.length - 1].point) < 0.01))) ||
          item instanceof paper.CompoundPath)
    )
    .sort((a, b) => a.index - b.index);

// Returns the top-level selected items on the painting layer, back→front.
// "Top-level" means direct children of the Layer (not inside a Group).
// Includes paper.Group so that Scratch groups count as one atomic unit.
export const getTopLevelSelected = (paper) =>
  paper.project.selectedItems
    .filter(
      (item) =>
        item.layer?.data?.isPaintingLayer &&
        (item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Group) &&
        item.parent instanceof paper.Layer
    )
    .sort((a, b) => a.index - b.index);

// Recursively collects all leaf Path/CompoundPath nodes from an item.
// Descends into Groups; treats Path and CompoundPath as leaves (not descended).
export const getLeafPaths = (item, paper) => {
  if (item instanceof paper.Group) return item.children.flatMap((c) => getLeafPaths(c, paper));
  return [item];
};

// ── Group-aware boolean helpers ────────────────────────────────────────
// Recursively subtracts all cutterLeaves from every leaf in item, rebuilding
// the original Group nesting at every depth. Returns the rebuilt item, or
// null if the item was entirely cut away.
export const subtractCuttersFrom = (item, cutterLeaves, paper) => {
  if (item instanceof paper.Group) {
    const rebuilt = item.children
      .slice()
      .map((c) => subtractCuttersFrom(c, cutterLeaves, paper))
      .filter(Boolean);
    return rebuilt.length > 0 ? new paper.Group(rebuilt) : null;
  }
  // Leaf: clone, subtract each cutter in sequence (A-(B∪C) = (A-B)-C).
  const style = cloneStyle(item);
  let current = item.clone();
  for (const cutter of cutterLeaves) {
    const prev = current;
    current = prev.subtract(cutter);
    if (current !== prev) prev.remove();
  }
  const cleaned = cleanResult(current);
  if (cleaned) applyStyle(cleaned, style);
  else current.remove();
  return cleaned;
};

// Collapses an item (potentially a nested Group) into a single flat region
// by uniting all its leaf shapes. Returns a temporary paper item — caller
// must .remove() it when done.
export const itemToRegion = (item, paper) => {
  const leaves = getLeafPaths(item, paper);
  let region = leaves[0].clone();
  for (let i = 1; i < leaves.length; i++) {
    const prev = region;
    region = prev.unite(leaves[i]);
    if (region !== prev) prev.remove();
  }
  return region;
};

// Recursively intersects every leaf in item with each clipRegion in sequence
// (A∩R1∩R2…), rebuilding the original Group nesting. Each clipRegion is a
// single pre-built shape (one per upper top-level item). Returns the rebuilt
// item, or null if no overlap remains.
export const intersectRegionsFrom = (item, clipRegions, paper) => {
  if (item instanceof paper.Group) {
    const rebuilt = item.children
      .slice()
      .map((c) => intersectRegionsFrom(c, clipRegions, paper))
      .filter(Boolean);
    return rebuilt.length > 0 ? new paper.Group(rebuilt) : null;
  }
  const style = cloneStyle(item);
  let current = item.clone();
  for (const clip of clipRegions) {
    const prev = current;
    current = prev.intersect(clip);
    if (current !== prev) prev.remove();
  }
  const cleaned = cleanResult(current);
  if (cleaned) applyStyle(cleaned, style);
  else current.remove();
  return cleaned;
};

// ── Expand helper ──────────────────────────────────────────────────────
// Recursively offsets every leaf in item (descending into Groups), preserving
// each leaf's own fill/stroke. Coincident adjacent points are merged first to
// prevent PathOffset producing jagged artefacts. Returns the rebuilt item
// (possibly a new Group), or null if everything was degenerate.
export const offsetItem = (item, amount, paper) => {
  if (item instanceof paper.Group) {
    const rebuilt = item.children
      .slice()
      .map((c) => offsetItem(c, amount, paper))
      .filter(Boolean);
    return rebuilt.length > 0 ? new paper.Group(rebuilt) : null;
  }
  // Leaf (Path or CompoundPath): preprocess then offset with its own style.
  const style = cloneStyle(item);
  // Open stroke-only paths (no fill, not closed) cannot be meaningfully
  // expanded — PathOffset would implicitly close them. Leave them unchanged.
  const isClosed = item instanceof paper.CompoundPath ? item.children.every((c) => c.closed) : item.closed;
  if (!style.fillColor && !isClosed) return item.clone();
  preprocessPaths([item], paper);
  mergeDuplicateSegments(item, paper);
  const raw = PathOffset.offset(item, amount, paper);
  const result = raw ? cleanResult(raw) : null;
  // If expansion failed preserve the item unchanged so it is never silently
  // dropped when the leaf sits inside a Group being rebuilt.
  if (!result) return item.clone();
  applyStyle(result, style);
  return result;
};

// ── Text conversion ────────────────────────────────────────────────────
// Converts selected PointText items to path outlines using rasterize+trace.
// Returns the number of items successfully converted.
export const convertTextItems = (paper) => {
  const textItems = paper.project.selectedItems.filter(
    (item) => item instanceof paper.PointText && item.layer?.data?.isPaintingLayer
  );
  let count = 0;
  for (const textItem of textItems) {
    const path = TextToPath.convert(textItem, paper);
    if (!path) continue;
    path.fillColor = textItem.fillColor ? textItem.fillColor.clone() : null;
    path.strokeColor = textItem.strokeColor ? textItem.strokeColor.clone() : null;
    path.strokeWidth = textItem.strokeWidth;
    const idx = textItem.index;
    const layer = textItem.layer;
    textItem.selected = false;
    textItem.remove();
    layer.insertChild(idx, path);
    path.selected = true;
    count++;
  }
  return count;
};
