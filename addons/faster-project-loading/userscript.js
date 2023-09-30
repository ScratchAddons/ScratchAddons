// This is a fix for https://github.com/scratchfoundation/scratch-gui/issues/8805

export default async function ({ addon }) {
  const BACKPACK_URL = "https://backpack.scratch.mit.edu/";
  // Inserting sprites from the backpack requests a ZIP archive from backpack.scratch.mit.edu, so we want to allow those
  const SPRITE_FILE_EXTENSION = ".zip";

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...moreArgs) {
    if (
      !addon.self.disabled &&
      method === "GET" &&
      url.startsWith(BACKPACK_URL) &&
      !url.endsWith(SPRITE_FILE_EXTENSION)
    ) {
      /*
              We don't want to block actual requests for backpack assets.
              A backpack request URL looks like:
                https://backpack.scratch.mit.edu/Tacodiva?limit=20&offset=0
              We can check for the '?' to differentiate them from wrong requests which look like:
                https://backpack.scratch.mit.edu/de9e1ed35f087dcb297f1339b16deaf6.svg
            */
      if (!url.includes("?")) throw new Error("Request blocked by Scratch Addons faster project loading. ");
    }
    originalOpen.call(this, method, url, ...moreArgs);
  };

  const originalPostMessage = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (message, options, ...moreArgs) {
    if (!addon.self.disabled && message && typeof message.id === "string" && typeof message.url === "string") {
      if (message.url.startsWith(BACKPACK_URL) && !message.url.endsWith(SPRITE_FILE_EXTENSION)) {
        throw new Error("Request blocked by Scratch Addons faster project loading.");
      }
    }
    originalPostMessage.call(this, message, options, ...moreArgs);
  };
}
