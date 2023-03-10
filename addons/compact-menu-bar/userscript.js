export default async function ({ addon }) {
  async function addSpan(username, profileSpans) {
    // Add username to "Profile" menu option
    const profile = profileSpans.appendChild(document.createElement("span"));
    profile.textContent = username;
    profile.className = "sa-profile-name";
  }

  if (await addon.auth.fetchIsLoggedIn()) {
    const username = await addon.auth.fetchUsername();
    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", async (e) => {
      if (e.detail.action.type !== "scratch-gui/menus/OPEN_MENU") return;
      if (e.detail.action.menu !== "accountMenu") return;
      const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt");
      addSpan(username, profileSpans);
    });
  }
}
