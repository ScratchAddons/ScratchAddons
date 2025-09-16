export default async function ({ addon, console, msg }) {
  let greenFlag;

  const contextMenuClass =
    addon.tab.scratchClass("context-menu_context-menu") || addon.tab.scratchClass("context-menu_context-menu-content"); // React 16 || React 18
  const contextMenu = Object.assign(document.createElement("nav"), {
    role: "menu",
    className: `${contextMenuClass} sa-flag-context-menu`,
  });
  const createItem = ({ id, text = "" } = {}) => {
    const item = Object.assign(document.createElement("div"), {
      role: "menuitem",
      className: addon.tab.scratchClass("context-menu_menu-item"),
      id,
      textContent: text,
    });
    item.addEventListener("mouseenter", () => item.setAttribute("data-highlighted", ""));
    item.addEventListener("mouseleave", () => item.removeAttribute("data-highlighted"));
    return item;
  };
  contextMenu.append(
    createItem({
      id: "sa-flag-menu-turbo",
      text: msg("turbo-on"),
    }),
    createItem({
      id: "sa-flag-menu-fps",
    }),
    createItem({
      id: "sa-flag-menu-mute",
    })
  );

  function closeContextMenu() {
    contextMenu.classList.remove("sa-flag-menu-open");
  }
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest("[role='menu']")) closeContextMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeContextMenu();
  });

  contextMenu.querySelector("#sa-flag-menu-turbo").addEventListener("click", () => {
    closeContextMenu();
    greenFlag.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
  });
  contextMenu.querySelector("#sa-flag-menu-fps").addEventListener("click", () => {
    closeContextMenu();
    greenFlag.dispatchEvent(new MouseEvent("click", { bubbles: true, altKey: true }));
  });
  contextMenu.querySelector("#sa-flag-menu-mute").addEventListener("click", () => {
    closeContextMenu();
    greenFlag.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
  });

  contextMenu.style.opacity = 0; // Setting opacity here fixes a visual glitch on dynamic enable
  addon.tab.displayNoneWhileDisabled(contextMenu);
  addon.self.addEventListener("disabled", closeContextMenu);

  addon.tab.traps.vm.on("TURBO_MODE_ON", () => {
    contextMenu.querySelector("#sa-flag-menu-turbo").textContent = msg("turbo-off");
  });
  addon.tab.traps.vm.on("TURBO_MODE_OFF", () => {
    contextMenu.querySelector("#sa-flag-menu-turbo").textContent = msg("turbo-on");
  });

  while (true) {
    greenFlag = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    greenFlag.parentElement.appendChild(contextMenu);
    greenFlag.addEventListener("contextmenu", (e) => {
      if (addon.self.disabled) return;
      e.preventDefault();
      contextMenu.classList.add("sa-flag-menu-open");
      contextMenu.style.left = e.clientX + "px";
      contextMenu.style.top = e.clientY + "px";
    });
  }
}
