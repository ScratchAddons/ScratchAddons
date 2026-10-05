import { getHexRegex, normalizeHex } from "../../../../libraries/common/cs/normalize-color.js";

export function sanitizeHex(value) {
  const hex = String(value).trim();
  // normalizeHex falls back to black for invalid input. Transparent fills and
  // malformed colors in project comments must instead be omitted from palettes.
  return getHexRegex().test(hex) ? normalizeHex(hex).toUpperCase() : null;
}
