// Pure colour-conversion helpers shared by the gradient editor modules.
// No side-effects, no DOM access — safe to import from any context.
// Colour operations delegate to the tinycolor global (loaded by userscript.js).

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Convert a paper.js Color to "#rrggbb"
export const colorToHex = (c) => tinycolor({ r: c.red * 255, g: c.green * 255, b: c.blue * 255 }).toHexString();

// Parse any CSS colour string → [r,g,b,a] (r/g/b 0–255, a 0–1), or null.
export const parseColor = (c) => {
  const t = tinycolor(c);
  if (!t.isValid()) return null;
  const { r, g, b, a } = t.toRgb();
  return [r, g, b, a];
};

// Normalise any CSS colour string to "#rrggbb" (strips alpha; redux dispatch expects hex).
export const ensureHex = (c) => tinycolor(c).toHexString();

// Convert a paper.js Color to a CSS string, preserving alpha when < 1.
export const colorToCss = (c) => {
  const t = tinycolor({ r: c.red * 255, g: c.green * 255, b: c.blue * 255, a: c.alpha });
  return c.alpha >= 1 ? t.toHexString() : t.toRgbString();
};
