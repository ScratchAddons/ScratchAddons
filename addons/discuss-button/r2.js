export default async function ({ addon, console }) {
  if (!addon.settings.get("compact-nav")) return;
  if (addon.tab.clientVersion == "scratch-www") return;
  if (await addon.auth.fetchIsLoggedIn()) {
    const username = await addon.auth.fetchUsername();
    const container = document.querySelector(".dropdown");
    const dropdown = container.querySelector(".dropdown-menu .user-nav");
    const profileSpans = dropdown.childNodes[0].childNodes[0];
    const span = profileSpans.appendChild(document.createElement("span"));
    span.className = "sa-profile-name";
    span.textContent = username;

    // Remove username next to icon.
    container.firstChild.removeChild(container.firstChild.childNodes[1]);
  }
}
