export default async function ({ addon, global, console }) {
  let propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
  let spriteContainer = propertiesPanel.parentElement;
  let spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper_"]');

  if (addon.settings.get("showByDefault")) togglePropertiesPanel();

  // Add a single event listener on the entire grid to take advantage of event bubbling
  spriteGrid.addEventListener("click", (e) => {
    let doubleClick = e.detail === 2;
    if (doubleClick) togglePropertiesPanel();
  });

  function togglePropertiesPanel() {
    spriteContainer.classList.toggle("sa-show-sprite-properties");
  }
}
