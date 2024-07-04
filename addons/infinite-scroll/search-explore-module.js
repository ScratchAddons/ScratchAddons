let currentRequests = 0;

const xhrOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, path, ...args) {
  const request = xhrOpen.call(this, method, path, ...args);

  try {
    const url = new URL(path);
    if ((url.pathname.startsWith("/search/") || url.pathname.startsWith("/explore/")) && method === "GET") {
      currentRequests++;
      this.addEventListener(
        "load",
        () => {
          // We intentionally do not decrease if request failed with non-2xx
          currentRequests--;
        },
        { once: true }
      );
    }
    return request;
  } catch (err) {
    console.error(err);
    return request;
  }
};

export function currentlyFetchingProjects() {
  return currentRequests != 0;
}
