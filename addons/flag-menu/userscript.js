export default async function ({ addon, console }) {
  let greenFlag;

  const contextMenu = Object.assign(document.createElement("nav"), {
    role: "menu",
    className: "flag-context-menu",
  });
  contextMenu.append(
    Object.assign(document.createElement("div"), {
      role: "menuitem",
      className: "flag-menu-item",
      id: "sa-flag-menu-turbo",
      textContent: "toggle turbo mode",
    }),
    Object.assign(document.createElement("div"), {
      role: "menuitem",
      className: "flag-menu-item",
      id: "sa-flag-menu-fps",
    }),
    Object.assign(document.createElement("div"), {
      role: "menuitem",
      className: "flag-menu-item",
      id: "sa-flag-menu-mute",
      textContent: "toggle mute",
    }),
  );

  function closeContextMenu() {
    contextMenu.classList.remove("ctx-menu-open");
  }
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".flag-context-menu")) closeContextMenu();
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

  while (true) {
    greenFlag = await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    greenFlag.parentElement.appendChild(contextMenu);
    greenFlag.addEventListener("contextmenu", (e) => {
      if (addon.self.disabled) return;
      e.preventDefault();
      contextMenu.classList.add("ctx-menu-open");
      contextMenu.style.left = e.clientX + "px";
      contextMenu.style.top = e.clientY + "px";
    });
  }
}
