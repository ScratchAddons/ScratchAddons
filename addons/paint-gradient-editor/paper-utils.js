// General paper.js helpers shared across gradient editor modules.
// Functions here are stateless and take a paper instance as their first argument.

// Return selected paper.js items that are shape-level: either direct Layer children (normal
// SELECT tool) or Group children (RESHAPE/shaping tool selecting a sub-path inside a group).
// scratch-paint groups are exactly one level deep, so checking the immediate parent is enough.
export const selectedShapes = (paper) =>
  paper?.project.selectedItems.filter((i) => i.parent instanceof paper.Layer || i.parent instanceof paper.Group) ?? [];
