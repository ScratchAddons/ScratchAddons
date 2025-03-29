import EditorFormatter from "./formatter.js";

export default async function ({ addon, console, msg, safeMsg: m }) {
  const editorFormatter = new EditorFormatter(addon, console, msg, m);

  function closeMenu(menu, reduxHandler) {
    reduxHandler.dispatch({
      type: "scratch-gui/menus/CLOSE_MENU",
      menu: menu,
    });
  }

  const checkFormattingMenu = editorFormatter.craftMenuOption(m("check-formatting"), {
    callback: (e) => {
      editorFormatter.checkFormatting("stage");
      closeMenu("editMenu", addon.tab.redux);
    },
    separator: false,
  });

  const formatProjectMenu = editorFormatter.craftMenuOption(m("format-project"), {
    callback: () => {
      editorFormatter.format();
      closeMenu("editMenu", addon.tab.redux);
    },
    separator: true,
  });

  while (true) {
    const editMenu = await addon.tab.waitForElement('div[class^="menu-bar_menu-bar-menu_"] ul[class^="menu_menu_"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/menus/OPEN_MENU"],
      reduxCondition: (state) => state.scratchGui.menus.editMenu,
    });

    if (!editMenu.closest('div[class*="menu_submenu_"]')) editMenu.append(formatProjectMenu, checkFormattingMenu);
  }
}
