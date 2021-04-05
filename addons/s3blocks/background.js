export default async function ({ addon }) {
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      return {
        redirectUrl: addon.self.dir + "/scratchblocks-v3.5-min.js",
      };
    },
    {
      urls: [
        "https://cdn.scratch.mit.edu/scratchr2/static/__98026e28996cc956930d5d5214f32de3__//djangobb_forum/scratchblocks/scratchblocks.js",
        addon.self.dir + "/scratchblocks-v3.5-min.js",
      ],
      types: ["script"],
    },
    ["blocking"]
  );
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      return {
        redirectUrl: addon.self.dir + "/menu.js",
      };
    },
    {
      urls: [
        "https://cdn.scratch.mit.edu/scratchr2/static/__98026e28996cc956930d5d5214f32de3__//djangobb_forum/scratchblocks/menu.js",
      ],
      types: ["script"],
    },
    ["blocking"]
  );
  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      return {
        redirectUrl: addon.self.dir + "/translation.min.js",
      };
    },
    {
      urls: [
        "https://cdn.scratch.mit.edu/scratchr2/static/__98026e28996cc956930d5d5214f32de3__//djangobb_forum/scratchblocks/translations.js",
      ],
      types: ["script"],
    },
    ["blocking"]
  );
}
