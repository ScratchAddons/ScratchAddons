chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request === "getSettingsInfo") {
    sendResponse({
      manifests: scratchAddons.manifests,
    });
  }
});
