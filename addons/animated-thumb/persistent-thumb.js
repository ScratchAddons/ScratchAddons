export default async ({ console }) => {
  // animated-thumb uses fetch to set thumbnails.
  // Therefore all XMLHttpRequest to thumbnail endpoint is ones we need to block.
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, path, ...args) {
    if (method === "POST" && String(path).startsWith("/internalapi/project/thumbnail/")) {
      console.log("Blocked overwriting thumbnails.");
      method = "OPTIONS"; // This makes sure thumbnail request errors.
    }
    return xhrOpen.call(this, method, path, ...args);
  };
};
