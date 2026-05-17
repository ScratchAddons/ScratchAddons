import TextToPath from "./text-to-path.js";
import PathOffset from "./path-offset.js";

// ── Degenerate detection ───────────────────────────────────────────────
// Checks whether a path is effectively empty — a zero-area sliver or a
// single-point artefact left over from a boolean op.
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

// Removes any empty sub-paths from a boolean op result, then returns the
// cleaned result or null if nothing usable remains.
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
// Snapshots an item's fill, stroke colour, and stroke width. Boolean ops
// in paper.js reliably lose style information, so we save before and
// restore after every operation.
export const cloneStyle = (src) => ({
  fillColor: src.fillColor ? src.fillColor.clone() : null,
  strokeColor: src.strokeColor ? src.strokeColor.clone() : null,
  strokeWidth: src.strokeWidth,
});

// Restores a previously snapshotted style onto an item.
export const applyStyle = (dst, style) => {
  dst.fillColor = style.fillColor;
  dst.strokeColor = style.strokeColor;
  dst.strokeWidth = style.strokeWidth;
};

// ── Path normalisation ─────────────────────────────────────────────────
// Fixes paths that Scratch stores as open but should be closed (e.g. circles
// whose last point sits on top of the first). Boolean ops treat open and
// closed paths differently, so we close them before operating.
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

// Merges consecutive segments that sit on the same point. Duplicate points
// cause PathOffset to produce jagged or degenerate output.
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
// Returns the selected closed paths and compound paths on the painting layer,
// sorted back-to-front. Includes Scratch's pseudo-open circles.
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

// Returns the top-level selected items on the painting layer, back-to-front.
// Groups are treated as one unit; child paths inside a Group are excluded.
export const getTopLevelSelected = (paper) =>
  paper.project.selectedItems
    .filter(
      (item) =>
        item.layer?.data?.isPaintingLayer &&
        (item instanceof paper.Path || item instanceof paper.CompoundPath || item instanceof paper.Group) &&
        item.parent instanceof paper.Layer
    )
    .sort((a, b) => a.index - b.index);

// Collects every leaf Path or CompoundPath from an item, descending into
// Groups. The leaves are the actual shapes boolean ops act on.
export const getLeafPaths = (item, paper) => {
  if (item instanceof paper.Group) return item.children.flatMap((c) => getLeafPaths(c, paper));
  return [item];
};

// ── Group-aware boolean helpers ────────────────────────────────────────
// Subtracts a set of cutter shapes from every leaf in item, preserving any
// Group nesting. Returns the rebuilt item, or null if fully cut away.
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

// Flattens an item (including nested Groups) into a single united shape.
// Used to treat a Group as one indivisible clip region. Caller must .remove()
// the returned item when done.
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

// Intersects every leaf in item with each clip region in sequence, preserving
// Group nesting. Returns the rebuilt item, or null if no overlap remains.
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
// Outsets every leaf shape in item by the given amount, descending into
// Groups. Used to convert a stroke into a filled outline. Returns the
// rebuilt item, or null if the result is entirely degenerate.
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
// Converts any selected text items to path outlines so boolean ops can act
// on them. Returns the number of items converted.
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
