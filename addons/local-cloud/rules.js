// The rules Scratch's cloud server applies. Invalid values are dropped
// silently by the server; invalid variable names close the connection.

export const CLOUD_PREFIX = "☁ ";
export const MAX_VALUE_LENGTH = 256;
export const MAX_NAME_LENGTH = 1024;

// Numbers only: digits, one optional leading minus, at most one decimal point.
// No E-notation, no hex, no "+", no spaces.
const NUMBER_STRING = /^-?\d*\.?\d*$/;

export function isValidName(name) {
  return (
    typeof name === "string" && name.startsWith(CLOUD_PREFIX) && name !== CLOUD_PREFIX && name.length <= MAX_NAME_LENGTH
  );
}

/**
 * @returns {null | "numbers" | "length" | "type"} why the value would be dropped, or null if it is valid
 */
export function getValueProblem(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "type";
    return String(value).length > MAX_VALUE_LENGTH ? "length" : null;
  }
  if (typeof value !== "string") return "type";
  if (value.length > MAX_VALUE_LENGTH) return "length";
  if (value === "-" || value === "." || !NUMBER_STRING.test(value)) return "numbers";
  return null;
}
