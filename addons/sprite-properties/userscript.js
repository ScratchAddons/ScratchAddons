export default async function ({ addon, global, console }) {
  let propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
  let spriteContainer = propertiesPanel.parentElement;
  let spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper_"]');

  toggleOnLoad();

  // Add a single event listener on the entire grid to take advantage of event bubbling
  spriteGrid.addEventListener("click", (e) => {
    let doubleClick = e.detail === 2;
    if (doubleClick) togglePropertiesPanel();
  });

  addon.self.addEventListener("disabled", () => togglePropertiesPanel());
  addon.self.addEventListener("reenabled", () => toggleOnLoad());

  function toggleOnLoad() {
    if (addon.settings.get("showByDefault")) togglePropertiesPanel();
  }

  function togglePropertiesPanel() {
    const showPropsClass = "sa-show-sprite-properties";
    if (!addon.self.disabled) spriteContainer.classList.toggle(showPropsClass);
    else spriteContainer.classList.remove(showPropsClass);
  }
}
