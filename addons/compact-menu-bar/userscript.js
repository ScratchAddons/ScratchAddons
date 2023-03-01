export default async function ({ addon }) {
  let profile;

  async function addSpan(username, profileSpans) {
    // Add username to "Profile" menu option
    profile = profileSpans.appendChild(document.createElement("span"));
    profile.textContent = username;
    profile.className = "sa-profile-name";
  }

  if (await addon.auth.fetchIsLoggedIn()) {
    const username = await addon.auth.fetchUsername();
    while (true) {
      const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt", {
        markAsSeen: true,
      });
      addSpan(username, profileSpans);
    }
  }
}
