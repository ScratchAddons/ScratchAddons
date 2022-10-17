export default async function ({ addon, global, console, msg }) {
  const showPropsClass = "sa-show-sprite-properties";
  const hidePropsClass = "sa-hide-sprite-properties";
  const propsBtnClass = "sa-sprite-properties-btn";
  const propsCloseBtnClass = "sa-sprite-properties-close-btn";

  let propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
  let spriteContainer = propertiesPanel.parentElement; // also contains sprite grid
  let spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper_"]');

  init();

  // Inject info bubble into current editing target
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST") {
      let spriteId = e.detail.action.editingTarget;
      if (!spriteId) return;
      let spriteIndex = e.detail.action.targets.findIndex((el) => el.id === spriteId);
      injectInfoButton(spriteIndex);
    }
  });
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

  async function injectInfoButton(spriteIndex) {
    let selectedSprite;
    if (spriteIndex) {
      selectedSprite = document.querySelector(
        `[class*='sprite-selector_sprite-wrapper_']:nth-child(${spriteIndex}) [class*="sprite-selector_sprite_"]`
      );
    } else {
      selectedSprite = await addon.tab.waitForElement(`[class*="sprite-selector-item_is-selected"]`);
    }
    injectButton(selectedSprite, propsBtnClass, "/info.svg", msg("open-properties-panel-tooltip"));
  }

  async function injectCloseButton() {
    let container = propertiesPanel.querySelector("[class*='sprite-info_row_']:nth-child(2)");
    injectButton(container, propsCloseBtnClass, "/collapse.svg", msg("close-properties-panel-tooltip"));
  }

  async function injectButton(container, className, iconPath, tooltip) {
    if (container.querySelector("." + className)) return;
    let btnIcon = document.createElement("img");
    btnIcon.setAttribute("src", addon.self.dir + iconPath);
    let btn = document.createElement("button");
    btn.classList.add(className);
    btn.setAttribute("title", tooltip);
    btn.setAttribute("tabindex", 0);
    btn.addEventListener("click", () => togglePropertiesPanel());
    btn.appendChild(btnIcon);
    container.appendChild(btn);
    addon.tab.displayNoneWhileDisabled(btn, { display: "flex" });
  }

  function removeCloseButton() {
    let closeBtn = document.querySelector("." + propsCloseBtnClass);
    if (closeBtn) closeBtn.remove();
  }
}
