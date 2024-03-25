export default async function ({ addon, console }) {
  // thanks World_Languages, code from scratch-messaging
  async function fetchAlerts(username, xToken) {
    return fetch(`https://api.scratch.mit.edu/users/${username}/messages/admin`, {
      headers: {
        "x-token": xToken,
      },
    }).then((res) => {
      if (!res.ok) throw HTTPError.fromResponse("Fetching alerts failed", res);
      return res.json();
    });
  }
  async function hasAlerts() {
    try {
      const [username, xToken] = await Promise.all([addon.auth.fetchUsername(), addon.auth.fetchXToken()]);
      if (scratchAddons.cookieFetchingFailed) throw new TypeError("NetworkError");
      if (!username) throw new MessageCache.HTTPError("User is not logged in", 401);
      const alerts = await fetchAlerts(username, xToken);
      return Array.isArray(alerts) && alerts.length > 0;
    } catch (err) {
      return false;
    }
  }

  async function highlightAlert() {
    let selector;
    if (addon.tab.editorMode === "editor") {
      selector = ".sa-editormessages-count";
    } else {
      if (addon.tab.editorMode === "fullscreen") return;
      selector = addon.tab.clientVersion === "scratchr2" ? ".notificationsCount" : ".message-count";
    }
    const messageBadge = await addon.tab.waitForElement(selector);
    messageBadge.classList.add("sa-alert-badge");
    const originalText = messageBadge.innerText;
    messageBadge.innerText = originalText.trim(); // remove space for better visuals
  }

  const hasAlertsResult = await hasAlerts();

  if (hasAlertsResult) {
    addon.tab.addEventListener("urlChange", () => {
      highlightAlert();
    });

    highlightAlert();
  }
}
