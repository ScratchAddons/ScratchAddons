export default async function ({ addon, console }) {
  if (!addon.settings.get("compact-nav")) return;
  if (addon.tab.clientVersion == "scratchr2") return;
  if (await addon.auth.fetchIsLoggedIn()) {
    const username = await addon.auth.fetchUsername();
    const dropdown = document.querySelector(".dropdown");
    const profileSpans = dropdown.childNodes[0].childNodes[0];
    const span = profileSpans.appendChild(document.createElement("span"));
    span.className = "sa-profile-name";
    span.textContent = username;
  }
}
