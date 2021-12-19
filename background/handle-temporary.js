chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.setTemporaryState) return;
  scratchAddons.globalState.temporary[request.key] = request.value;
  sendResponse();
});
