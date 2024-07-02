export default async function ({ addon, console }) {
  // Detects whether the current page is using scratch-www or scratchr2.
  // The search bars have different selectors depending on this, so we need to figure out which selector to use.
  const SEARCH_BAR_SELECTOR = addon.tab.clientVersion === "scratch-www" ? "#frc-q-1088" : "#search-input";
  let searchBar = null;
  addon.self.addEventListener("disabled", () => {
    if (searchBar) searchBar.autocomplete = "on";
  });
  addon.self.addEventListener("reenabled", () => {
    if (searchBar) searchBar.autocomplete = "off";
  });
  while (true) {
    // Wait for the current search bar to load.
    searchBar = await addon.tab.waitForElement(SEARCH_BAR_SELECTOR, {
      markAsSeen: true,
      reduxCondition: (state) => (state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true),
    });
    // Check if this addon is disabled; because the end-user
    // could have disabled the addon while they were in the editor.
    if (!addon.self.disabled) {
      searchBar.autocomplete = "off";
    }
  }
}
