export default async function ({ addon }) {
  while (true) {
    // Profile account menu item
    const menuItem = await addon.tab.waitForElement("[class^=account-nav_user-info_] + div > ul > :first-child", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/menus/OPEN_MENU"],
      reduxCondition: (state) => state.scratchGui.menus.accountMenu,
    });
    if (addon.settings.get("compact-username")) {
      const usernameSpan = document.createElement("span");
      usernameSpan.textContent = await addon.auth.fetchUsername();
      usernameSpan.className = "sa-profile-name";
      menuItem.appendChild(usernameSpan);
    }
  }
}
