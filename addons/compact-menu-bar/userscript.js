export default async function ({ addon }) {
  let span;
  let li;
  if (await addon.auth.fetchIsLoggedIn()) {
    while (true) {
      // Remove username from bar
      const username = await addon.auth.fetchUsername();
      const dropdown = await addon.tab.waitForElement(".account-nav_profile-name_2oRiV");
      const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt");
      span = dropdown;
      span?.remove();
      // Add username to "Profile" menu option
      li = profileSpans.appendChild(document.createElement("span"));
      li.className = "sa-profile-name";
      li.textContent = username;
    }
  }
}
