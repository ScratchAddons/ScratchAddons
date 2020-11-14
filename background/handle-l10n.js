chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.msg) {
    return sendResponse(scratchAddons.l10n.get(request.msg, request.placeholders || {}));
  }
  if (request && request.messages) {
    return sendResponse(request.messages.map(
        value => typeof value === "string"
            ? (scratchAddons.l10n.messages[value] || value)
            : scratchAddons.l10n.get(value.msg, value.placeholders)
    ));
  }
  if (request && request.loadMsgByAddonIds) {
    scratchAddons.l10n.load(request.loadMsgByAddonIds).then(() => sendResponse(true));
    return true;
  }
});
