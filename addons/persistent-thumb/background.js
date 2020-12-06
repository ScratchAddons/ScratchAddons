export default async ({ addon, console }) => {
  const onThumbnailSet = (details) => {
    // Don't handle if it's not from editor (e.g. image-uploader)
    if (!/\/editor/g.test(details.originUrl)) return;
    if (!details.requestHeaders) return;
    // If X-ScratchAddons-Allow-Persistent is set, ignore.
    if (details.requestHeaders.find(header => header.name === "X-ScratchAddons-Allow-Persistent")) return;
    console.log("Blocked thumbnail from being saved.");
    return ({ cancel: true });
  };
  
  chrome.webRequest.onBeforeSendHeaders.addListener(
    onThumbnailSet,
    {
      urls: ["https://scratch.mit.edu/internalapi/project/thumbnail/*/set/"],
      types: ["xmlhttprequest"]
    },
    ["blocking", "requestHeaders"]
  );
  addon._onKilled.push(() => chrome.webRequest.onBeforeSendHeaders.removeListener(onThumbnailSet));
};