export default async function ({ addon }) {
  if (addon.tab.clientVersion === "scratchr2") return;
  let span;
  const change = async (enabled) => {
    if (await addon.auth.fetchIsLoggedIn()) {
      const username = await addon.auth.fetchUsername();
      const dropdown = await addon.tab.waitForElement(".dropdown");
      if (!enabled) {
        span?.remove();
        span = null;
        return;
      }
      const profileSpans = dropdown.childNodes[0].childNodes[0];
      if (!span) {
        span = profileSpans.appendChild(document.createElement("span"));
        span.className = "sa-profile-name";
        span.textContent = username;
      }
    }
  };
  if (addon.settings.get("compact-nav")) change(true);
  addon.settings.addEventListener("change", () => {
    change(addon.settings.get("compact-nav"));
  });
  addon.self.addEventListener("disabled", () => change(false));
  addon.self.addEventListener("reenabled", () => {
    change(addon.settings.get("compact-nav"));
  });
}
