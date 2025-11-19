export function isFirefox() {
  return typeof browser?.runtime.getBrowserInfo === "function";
}
