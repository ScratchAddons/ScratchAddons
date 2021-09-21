export default function (request, sendResponse) {
  if (request && request.msg) {
    sendResponse(scratchAddons.l10n.get(request.msg, request.placeholders || {}));
    return true;
  }
  if (request && request.l10nAddonId) {
    sendResponse(
      Object.fromEntries(
        Object.keys(scratchAddons.l10n.messages)
          .filter((value) => value.startsWith(`${request.l10nAddonId}/`))
          .map((value) => [value, scratchAddons.l10n.messages[value]])
      )
    );
    return true;
  }
  if (request && request.messages) {
    sendResponse(request.messages.map((value) => scratchAddons.l10n.messages[value] || value));
    return true;
  }
  return false;
}
