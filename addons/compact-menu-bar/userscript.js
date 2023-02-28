export default async function ({ addon }) {
  let profile;

  async function addSpan() {
    // Add username to "Profile" menu option
    const username = await addon.auth.fetchUsername();
    const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt");
    profile = profileSpans.appendChild(document.createElement("span"));
    profile.textContent = username;
    profile.className = "sa-profile-name";
  }

  if (await addon.auth.fetchIsLoggedIn()) setInterval(addSpan(), 1);
}
