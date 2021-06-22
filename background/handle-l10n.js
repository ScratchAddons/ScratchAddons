chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request && request.msg) {
    return sendResponse(scratchAddons.l10n.get(request.msg, request.placeholders || {}));
  }
  if (request?.l10nAddonId) {
    return sendResponse(
      Object.fromEntries(
        Object.keys(scratchAddons.l10n.messages)
          .filter((value) => value.startsWith(`${request.l10nAddonId}/`))
          .map((value) => [value, scratchAddons.l10n.messages[value]])
      )
    );
  }
  if (request && request.messages) {
    return sendResponse(
      request.messages.map(/** @param {string} value */ (value) => scratchAddons.l10n.messages[value] || value)
    );
  }
});
