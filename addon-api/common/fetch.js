/**
 * Fetches resource from Scratch API with authentication.
 * @param {string} url - URL of the resource.
 * @param {object=} opts - options.
 * @returns {Promise<Response>}
 */
export default function fetch(url, opts = {}) {
  if (!opts.headers) opts.headers = {};
  opts.headers["X-ScratchAddons-Uses-Fetch"] = "true";
  return window.fetch(url, opts);
}
