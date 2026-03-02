export const BACKPACK_URL = "https://backpack.scratch.mit.edu/";

/**
 * Returns true if a web worker request is being caused by the Scratch bug
 * https://github.com/scratchfoundation/scratch-gui/issues/8805
 * @param {*} message The message being sent to the web worker.
 * @returns {boolean}
 */
export function isBadRequest(message) {
  if (!message) return false;

  if (typeof message.id !== "string" || typeof message.url !== "string") return false;

  if (!message.url.startsWith(BACKPACK_URL)) return false;

  return true;
}
