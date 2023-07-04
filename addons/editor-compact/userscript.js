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

  // Icons in the sound editor don't have tooltips. Add them if labels are hidden.
  const updateTooltips = () => {
    for (const button of document.querySelectorAll(
      "[class*='sound-editor_tool-button_'], [class*='sound-editor_effect-button_']"
    )) {
      const icon = button.querySelector("img");
      if (!addon.self.disabled && addon.settings.get("hideLabels")) icon.title = button.textContent;
      else icon.removeAttribute("title");
    }
  };
  updateTooltips();
  addon.settings.addEventListener("change", updateTooltips);
  addon.self.addEventListener("disabled", updateTooltips);
  addon.self.addEventListener("reenabled", updateTooltips);
  while (true) {
    await addon.tab.waitForElement("[class*='sound-editor_editor-container_']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly && state.scratchGui.editorTab.activeTabIndex === 2,
    });
    updateTooltips();
  }
}
