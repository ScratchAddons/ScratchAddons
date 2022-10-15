export default async function ({ addon, global, console }) {
  // The workspace needs to be manually resized via a window resize event
  // whenever the addon modifies or stops modifying UI elements
  resizeWorkspace();

  let resizeObserver = new ResizeObserver(resizeWorkspace);
  let menuBar = await addon.tab.waitForElement(
    '[class*="gui_menu-bar-position"][class*="menu-bar_menu-bar"][class*="box_box"]'
  );
  resizeObserver.observe(menuBar);

  async function resizeWorkspace() {
    window.dispatchEvent(new Event("resize"));
  }
}
