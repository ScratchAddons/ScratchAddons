scratchAddons.localEvents.addEventListener("badgeUpdateNeeded", () => {
  // Note: for now, only one addon can use the badge.
  // If you want your addon to use the badge's text
  // or color, please open an issue on GitHub.
  const hardcodedBadgeUser = "msg-count-badge";
  if (scratchAddons.localState.addonsEnabled[hardcodedBadgeUser] && !scratchAddons.muted) {
    let text = scratchAddons.localState.badges[hardcodedBadgeUser].text;
    if (text === null || text === 0) text = "";
    else if (typeof text === "number") text = String(text);
    chrome.browserAction.setBadgeText({ text });
    let color = scratchAddons.localState.badges[hardcodedBadgeUser].color;
    if (color === null) color = [140, 230, 140, 255];
    chrome.browserAction.setBadgeBackgroundColor({ color });
  } else {
    // Hide badge
    chrome.browserAction.setBadgeText({ text: "" });
  }
});
