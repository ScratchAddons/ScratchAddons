chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request === "getGlobalState") sendResponse(scratchAddons.globalState);
});