export function isFirefox() {
  return typeof new Error().fileName !== "undefined";
}
