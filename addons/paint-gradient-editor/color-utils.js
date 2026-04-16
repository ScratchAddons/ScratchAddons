export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Convert a paper.js Color to "#rrggbb"
export const colorToHex = (c) =>
  "#" +
  [c.red, c.green, c.blue]
    .map((v) =>
      Math.round(clamp(v, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("");

// Parse "#rrggbb", "rgb(r,g,b)" or "rgba(r,g,b,a)" → [r,g,b,a] (a is 0–1), or null.
export const parseColor = (c) => {
  if (!c || typeof c !== "string") return null;
  if (c.startsWith("#") && c.length >= 7)
    return [...[0, 1, 2].map((i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16)), 1];
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  return m ? [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1] : null;
};

// Normalise any CSS colour string to "#rrggbb" (strips alpha; redux dispatch expects hex).
export const ensureHex = (c) => {
  const arr = parseColor(c);
  return arr
    ? "#" +
        arr
          .slice(0, 3)
          .map((v) =>
            Math.round(clamp(v, 0, 255))
              .toString(16)
              .padStart(2, "0")
          )
          .join("")
    : c;
};

// Convert a paper.js Color to a CSS string, preserving alpha when < 1.
export const colorToCss = (c) => {
  if (!c || c.alpha >= 1) return colorToHex(c);
  return `rgba(${Math.round(c.red * 255)},${Math.round(c.green * 255)},${Math.round(c.blue * 255)},${Math.round(c.alpha * 1000) / 1000})`;
};
