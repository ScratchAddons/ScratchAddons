export default async function ({ addon, global, console, msg }) {
  const SHOW_PROPS_CLASS = "sa-show-sprite-properties";
  const HIDE_PROPS_CLASS = "sa-hide-sprite-properties";
  const PROPS_BTN_CLASS = "sa-sprite-properties-btn";
  const PROPS_CLOSE_BTN_CLASS = "sa-sprite-properties-close-btn";

  /** @type {HTMLElement} */
  let propertiesPanel;
  /** @type {HTMLElement} */
  let spriteContainer; // also contains sprite grid

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
  document.body.addEventListener(
    "mouseleave",
    (e) => {
      if (e.target.matches('[class*="sprite-selector_sprite-selector_2KgCX"]')) {
        autoHidePanel();
      }
    },
    {
      capture: true,
    }
  );

  addon.settings.addEventListener("change", () => autoHidePanel());
  addon.self.addEventListener("disabled", () => {
    setPropertiesPanelVisible(true);
    removeCloseButton();
  });

  function setPropertiesPanelVisible(visible) {
    if (spriteContainer) {
      spriteContainer.classList.toggle(SHOW_PROPS_CLASS, visible);
      spriteContainer.classList.toggle(HIDE_PROPS_CLASS, !visible);
    }
  }

  function togglePropertiesPanel() {
    const isCurrentlyOpen = spriteContainer.classList.contains(SHOW_PROPS_CLASS);
    setPropertiesPanelVisible(!isCurrentlyOpen);
  }

  function autoHidePanel() {
    if (addon.settings.get("autoCollapse")) {
      setPropertiesPanelVisible(false);
    }
  }

  function injectInfoButton(spriteIndex) {
    let selectedSprite;
    if (typeof spriteIndex === 'number') {
      selectedSprite = document.querySelector(
        `[class*='sprite-selector_sprite-wrapper_']:nth-child(${spriteIndex}) [class*="sprite-selector_sprite_"]`
      );
    } else {
      selectedSprite = document.querySelector('[class*="sprite-selector-item_is-selected"]');
    }
    if (selectedSprite) {
      injectButton(selectedSprite, PROPS_BTN_CLASS, "/info.svg", msg("open-properties-panel-tooltip"));
    }
  }

  async function injectCloseButton() {
    injectButton(propertiesPanel, PROPS_CLOSE_BTN_CLASS, "/collapse.svg", msg("close-properties-panel-tooltip"));
  }

  async function injectButton(container, className, iconPath, tooltip) {
    if (container.querySelector("." + className)) return;
    let btnIcon = document.createElement("img");
    btnIcon.setAttribute("src", addon.self.dir + iconPath);
    btnIcon.draggable = false;
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

  function updateWideLocaleMode() {
    // Certain languages, such as Japanese, use a different layout for the sprite info panel
    // Easiest way to detect this without hardcoding a language list is with this selector that only
    // exists when the sprite info panel is using the larger layout with text above the input.
    const isWideLocale = !!propertiesPanel.querySelector("[class^=label_input-group-column_]");
    document.body.classList.toggle('sa-sprite-properties-wide-locale', isWideLocale);
  }

  document.addEventListener(
    "click",
    (e) => {
      // In small stage mode, wide locales use the same properties panel as other languages.
      if (
        e.target.closest("[class*='stage-header_stage-button-first']") ||
        e.target.closest("[class*='stage-header_stage-button-last']")
      ) {
        setTimeout(updateWideLocaleMode);
      }
    },
    { capture: true }
  );

  while (true) {
    propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]', {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    spriteContainer = propertiesPanel.parentElement; // also contains sprite grid
    updateWideLocaleMode();
    setPropertiesPanelVisible(!addon.settings.get("hideByDefault"));
    injectInfoButton();
    injectCloseButton();
  }
}
