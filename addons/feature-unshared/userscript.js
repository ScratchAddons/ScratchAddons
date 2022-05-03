/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async function ({ addon, global, console }) {
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (url && url.startsWith("/site-api/projects/shared/")) {
      const urlUrl = new URL(location.origin + url);
      urlUrl.pathname = urlUrl.pathname.replace(/shared\/[\w-]+/, "all");
      url = urlUrl.toString();
    }
    return xhrOpen.call(this, method, url, ...args);
  };
}
