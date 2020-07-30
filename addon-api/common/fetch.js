export default function fetch(url, opts = {}) {
  return window.fetch(url, {
    headers: {
      ...opts.headers,
      "X-ScratchAddons-Uses-Fetch": "true",
    },
    ...opts,
  });
}
