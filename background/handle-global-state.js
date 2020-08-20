chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getGlobalState")
    sendResponse(scratchAddons.globalState._target); // Firefox breaks if we send a proxy
});
