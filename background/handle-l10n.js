chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.msg) {
    return sendResponse(scratchAddons.l10n.get(request.msg, request.placeholders || {}));
  }
  if (request && request.l10nAddonId) {
    return sendResponse(
      Object.fromEntries(
        Object.keys(scratchAddons.l10n.messages)
          .filter((value) => value.startsWith(`${request.l10nAddonId}/`) || value.startsWith(`_`))
          .map((value) => [value, scratchAddons.l10n.messages[value]]),
      ),
    );
  }
  if (request && request.messages) {
    return sendResponse(request.messages.map((value) => scratchAddons.l10n.messages[value] || value));
  }
});
