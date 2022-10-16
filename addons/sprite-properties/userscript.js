export default async function ({ addon, global, console, msg }) {
  const showPropsClass = "sa-show-sprite-properties";
  const hidePropsClass = "sa-hide-sprite-properties";
  const propsCloseBtnClass = "sa-sprite-properties-close-btn";

  let propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
  let spriteContainer = propertiesPanel.parentElement; // also contains sprite grid
  let spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper_"]');

  init();

  // Add a single event listener on the entire grid to take advantage of event bubbling
  spriteGrid.addEventListener("click", (e) => {
    let doubleClick = e.detail === 2;
    if (doubleClick) togglePropertiesPanel();
  });
  // Close properties panel when mouse leaves the entire sprite panel
  spriteContainer.addEventListener("mouseleave", () => autoHidePanel());

  addon.settings.addEventListener("change", () => autoHidePanel());
  addon.self.addEventListener("disabled", () => {
    togglePropertiesPanel();
    removeCloseButton();
  });
  addon.self.addEventListener("reenabled", () => init());

  function init() {
    toggleOnLoad();
    injectInfoButton();
    injectCloseButton();
  }

  function toggleOnLoad() {
    spriteContainer.classList.toggle(hidePropsClass);
    if (!addon.settings.get("hideByDefault")) togglePropertiesPanel();
  }

  function togglePropertiesPanel() {
    if (!addon.self.disabled) {
      spriteContainer.classList.toggle(showPropsClass);
      spriteContainer.classList.toggle(hidePropsClass);
    } else {
      spriteContainer.classList.remove(showPropsClass);
      spriteContainer.classList.remove(hidePropsClass);
    }
  }

  function autoHidePanel() {
    if (addon.settings.get("autoCollapse") && spriteContainer.classList.contains(showPropsClass)) {
      togglePropertiesPanel();
    }
  }

  async function injectCloseButton() {
    if (propertiesPanel.querySelector("." + propsCloseBtnClass)) return;
    let closeBtnIcon = document.createElement("img");
    closeBtnIcon.setAttribute("src", addon.self.dir + "/collapse.svg");
    let closeBtn = document.createElement("button");
    closeBtn.classList.add(propsCloseBtnClass);
    closeBtn.setAttribute("title", msg("close-properties-panel-tooltip"));
    closeBtn.setAttribute("tabindex", 0);
    closeBtn.addEventListener("click", () => togglePropertiesPanel());
    closeBtn.appendChild(closeBtnIcon);
    propertiesPanel.querySelector("[class*='sprite-info_row_']:nth-child(2)").appendChild(closeBtn);
  }

  function removeCloseButton() {
    let closeBtn = document.querySelector("." + propsCloseBtnClass);
    if (closeBtn) closeBtn.remove();
  }
}
