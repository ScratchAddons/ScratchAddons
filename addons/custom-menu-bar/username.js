export default async function ({ addon }) {
  while (true) {
    const menuItem = await addon.tab.waitForElement("[class^=menu_menu_] > :first-child", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/menus/OPEN_MENU"],
      reduxCondition: (state) => state.scratchGui.menus.accountMenu,
    });
    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = await addon.auth.fetchUsername();
    usernameSpan.className = "sa-profile-name";
    menuItem.appendChild(usernameSpan);
  }
}
