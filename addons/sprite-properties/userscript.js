export default async function ({ addon, global, console, msg }) {
  const SHOW_PROPS_CLASS = "sa-show-sprite-properties";
  const HIDE_PROPS_CLASS = "sa-hide-sprite-properties";
  const PROPS_BTN_CLASS = "sa-sprite-properties-btn";
  const PROPS_CLOSE_BTN_CLASS = "sa-sprite-properties-close-btn";

  let propertiesPanel;
  let spriteContainer; // also contains sprite grid
  let spriteGrid;

  await init();

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
  addon.tab.addEventListener("urlChange", () => {
    if (addon.tab.editorMode === "editor") init();
  });

  async function init() {
    propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]');
    spriteContainer = propertiesPanel.parentElement; // also contains sprite grid
    spriteGrid = await addon.tab.waitForElement('[class^="sprite-selector_scroll-wrapper_"]');
    toggleOnLoad();
    injectInfoButton();
    injectCloseButton();
  }

  function toggleOnLoad() {
    spriteContainer.classList.toggle(HIDE_PROPS_CLASS);
    if (!addon.settings.get("hideByDefault")) togglePropertiesPanel();
  }

  function togglePropertiesPanel() {
    if (!addon.self.disabled) {
      spriteContainer.classList.toggle(SHOW_PROPS_CLASS);
      spriteContainer.classList.toggle(HIDE_PROPS_CLASS);
    } else {
      spriteContainer.classList.remove(SHOW_PROPS_CLASS);
      spriteContainer.classList.remove(HIDE_PROPS_CLASS);
    }
  }

  function autoHidePanel() {
    if (addon.settings.get("autoCollapse") && spriteContainer.classList.contains(SHOW_PROPS_CLASS)) {
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
    injectButton(selectedSprite, PROPS_BTN_CLASS, "/info.svg", msg("open-properties-panel-tooltip"));
  }

  async function injectCloseButton() {
    injectButton(propertiesPanel, PROPS_CLOSE_BTN_CLASS, "/collapse.svg", msg("close-properties-panel-tooltip"));
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
    let closeBtn = document.querySelector("." + PROPS_CLOSE_BTN_CLASS);
    if (closeBtn) closeBtn.remove();
  }
}
