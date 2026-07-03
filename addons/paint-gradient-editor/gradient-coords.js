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

// Classify a linear gradient's axis as HORIZONTAL or VERTICAL from a raw (non-absolute)
// destination-minus-origin delta — whichever axis has the larger magnitude wins.
export const classifyLinearType = (dx, dy) => (Math.abs(dy) > Math.abs(dx) ? "VERTICAL" : "HORIZONTAL");

// Standard math angle (0–359°) of a vector: atan2(dy, dx), 0°=right, 90°=down, in paper.js's
// y-down screen coordinates. Used wherever a gradient axis angle is read/stored (e.g. the
// angle slider, or re-deriving it from a sampled gradient's origin/destination).
export const vectorToDeg = (dx, dy) => {
  let deg = Math.atan2(dy, dx) * (180 / Math.PI);
  if (deg < 0) deg += 360;
  return deg;
};

// CSS linear-gradient angle (clockwise from "to top") for a direction vector in paper.js's
// y-down screen coordinates: right→90°, down→180°, left→270°, up→0°. Used wherever a
// gradient axis needs to be drawn as an actual CSS `linear-gradient(<deg>deg, ...)`.
export const vectorToCssAngleDeg = (dx, dy) => {
  let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (deg < 0) deg += 360;
  return deg;
};
