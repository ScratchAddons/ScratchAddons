export default async function ({ addon, global, console }) {
  const showPropsClass = "sa-show-sprite-properties";

  let propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
  let spriteContainer = propertiesPanel.parentElement; // also contains sprite grid
  let spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper_"]');

  toggleOnLoad();

  // Add a single event listener on the entire grid to take advantage of event bubbling
  spriteGrid.addEventListener("click", (e) => {
    let doubleClick = e.detail === 2;
    if (doubleClick) togglePropertiesPanel();
  });
  // Close properties panel when mouse leaves the entire sprite panel
  spriteContainer.addEventListener("mouseleave", () => autoHidePanel());

  addon.settings.addEventListener("change", () => autoHidePanel());
  addon.self.addEventListener("disabled", () => togglePropertiesPanel());
  addon.self.addEventListener("reenabled", () => toggleOnLoad());

  function toggleOnLoad() {
    if (addon.settings.get("hideByDefault")) togglePropertiesPanel();
  }

  function togglePropertiesPanel() {
    if (!addon.self.disabled) spriteContainer.classList.toggle(showPropsClass);
    else spriteContainer.classList.remove(showPropsClass);
  }

  function autoHidePanel() {
    if (addon.settings.get("autoCollapse") && spriteContainer.classList.contains(showPropsClass)) {
      togglePropertiesPanel();
    }
  }
}
