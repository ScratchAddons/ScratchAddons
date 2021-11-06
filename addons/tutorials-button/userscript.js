export default async function ({ addon, global, console }) {
  const buttonSelector = `[aria-label="${addon.tab.scratchMessage(
    "gui.menuBar.tutorialsLibrary"
  )}"][class*="menu-bar_menu-bar-item"][class*="menu-bar_hoverable"]`;
  let button = await addon.tab.waitForElement(buttonSelector);
  refresh();

  addon.self.addEventListener("urlChange", () => refresh());
  addon.settings.addEventListener("change", () => refresh());
  addon.self.addEventListener("disabled", () => refresh());
  addon.self.addEventListener("reenabled", () => refresh());

  function refresh() {
    button = document.querySelector(buttonSelector);
    if (!addon.self.disabled) {
      button.querySelector("span").innerText = addon.settings.get("label");
      button.removeEventListener("click", openTab);
      button.addEventListener("click", openTab);
    } else {
      button.querySelector("span").innerText = addon.tab.scratchMessage("gui.menuBar.tutorialsLibrary");
      button.removeEventListener("click", openTab);
    }
  }

  async function openTab() {
    window.open(addon.settings.get("url"), "_blank");
    // Waits for the Tutorials page to open, then closes it
    await addon.tab.waitForElement(".ReactModalPortal > .ReactModal__Overlay");
    window.history.back();
  }
}
