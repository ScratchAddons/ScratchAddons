export default async function ({ addon }) {
  if (!(await addon.auth.fetchIsLoggedIn())) return; // Skip if not logged in
  addon.tab.redux.initialize(); // Start listening to Redux events
  addon.tab.redux.addEventListener("statechanged", async (e) => {
    if (!addon.settings.get("compact-username")) return; // Skip if the option is disabled
    if (e.detail.action.type !== "scratch-gui/menus/OPEN_MENU" || e.detail.action.menu !== "accountMenu") return; // Skip if another Redux event occurs
    const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt"); // Do this if the menu is opened
    const profile = profileSpans.appendChild(document.createElement("span")); // Add username to "Profile" menu option
    const username = await addon.auth.fetchUsername();
    profile.textContent = username;
    profile.className = "sa-profile-name";
  });
}
