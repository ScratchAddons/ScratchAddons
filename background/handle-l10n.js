chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.msg) {
    sendResponse(scratchAddons.l10n.get(request.msg, request.placeholders || {}));
  }
  if (request && request.loadMsgByAddonIds) {
    scratchAddons.l10n.load(request.loadMsgByAddonIds).then(() => sendResponse(true));
    return true;
  }
});
