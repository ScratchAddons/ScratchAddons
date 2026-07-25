export default async function ({ addon }) {
  while (true) {
    // Profile account menu item
    const menuItem = await addon.tab.waitForElement("[class*=account-menu_user-info_] + div > ul > :first-child", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    if (addon.settings.get("compact-username")) {
      const usernameSpan = document.createElement("span");
      usernameSpan.textContent = await addon.auth.fetchUsername();
      usernameSpan.className = "sa-editor-profile-name";
      menuItem.appendChild(usernameSpan);
    }
  }
}
