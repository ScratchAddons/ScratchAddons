// Uniform handle diameter used for cramped-spacing maths (= 2 × extra-stop shadow radius 7).
// Circles at equal offsets will touch (center-to-center = STOP_D) but not overlap.
export const STOP_D = 14;

// Create coordinate helper functions bound to a specific paper.js view and canvas element.
// Returns toSVG and toProject as closures so callers don't thread paper+canvas everywhere.
export const makeCoordHelpers = (paper, canvas) => ({
  // Convert a paper.js project point → SVG overlay pixel coordinate.
  toSVG: (pt) => {
    const vp = paper.view.projectToView(pt);
    return { x: vp.x + canvas.offsetLeft, y: vp.y + canvas.offsetTop };
  },
  // Convert a client (screen) coordinate → paper.js project point.
  toProject: (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return paper.view.viewToProject(new paper.Point(clientX - r.left, clientY - r.top));
  },
});

// Project a paper.js point onto the origin→destination axis. Returns t ∈ [0,1].
export const projectOntoAxis = (pt, origin, dest) => {
  const axis = dest.subtract(origin);
  const len2 = axis.dot(axis);
  if (len2 === 0) return 0;
  return Math.max(0, Math.min(1, pt.subtract(origin).dot(axis) / len2));
};

// Map a logical [0,1] stop offset to an axis display fraction.
// Reserves STOP_D pixels per inner handle so handles at equal offsets touch but don't overlap.
//   innerIdx:   0-based slot among moveable handles (excluding fixed endpoints).
//   innerCount: total moveable handles on this axis.
// Returns null when the axis is too short — callers fall back to the raw offset.
export const crampedFrac = (innerIdx, innerCount, offset, axisLenPx) => {
  const usable = axisLenPx - (innerCount + 1) * STOP_D;
  if (usable <= 0) return null;
  return ((innerIdx + 1) * STOP_D + offset * usable) / axisLenPx;
};

// Inverse of crampedFrac: mouse rawFrac on the axis → logical [0,1] offset for innerIdx.
export const crampedToOffset = (innerIdx, innerCount, rawFrac, axisLenPx) => {
  const usable = axisLenPx - (innerCount + 1) * STOP_D;
  if (usable <= 0) return rawFrac;
  return (rawFrac * axisLenPx - (innerIdx + 1) * STOP_D) / usable;
};
