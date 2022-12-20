export default async function ({ addon, global, console, msg }) {
  const SHOW_PROPS_CLASS = "sa-show-sprite-properties";
  const HIDE_PROPS_CLASS = "sa-hide-sprite-properties";
  const PROPS_BTN_CLASS = "sa-sprite-properties-btn";
  const PROPS_CLOSE_BTN_CLASS = "sa-sprite-properties-close-btn";

  let propertiesPanel;
  let spriteContainer; // also contains sprite grid

  await init();

  // Inject info bubble into current editing target
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST") {
      let spriteId = e.detail.action.editingTarget;
      if (!spriteId) return;
      let spriteIndex = e.detail.action.targets.findIndex((el) => el.id === spriteId);
      // The focused sprite might not be in the target list if, for example, we are editing a clone.
      if (spriteIndex !== -1) {
        injectInfoButton(spriteIndex);
      }
    }
  });

  // Open the properties panel when double clicking in the sprite grid
  document.addEventListener("click", (e) => {
    if (e.detail === 2 && e.target.closest('[class^="sprite-selector_scroll-wrapper_"]')) {
      togglePropertiesPanel();
    }
  });

  // Close properties panel when mouse leaves the entire sprite panel
  document.addEventListener("mouseleave", (e) => {
    if (e.target.matches('[class*="sprite-selector_sprite-selector_2KgCX"]')) {
      autoHidePanel();
    }
  }, {
    capture: true
  });

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
    let container = propertiesPanel.querySelector("[class*='sprite-info_row_']:nth-child(2)");
    injectButton(container, PROPS_CLOSE_BTN_CLASS, "/collapse.svg", msg("close-properties-panel-tooltip"));
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
