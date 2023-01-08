export default async function ({ addon, global, console, msg }) {
  const SHOW_PROPS_CLASS = "sa-show-sprite-properties";
  const HIDE_PROPS_CLASS = "sa-hide-sprite-properties";
  const PROPS_INFO_BTN_CLASS = "sa-sprite-properties-info-btn";
  const PROPS_CLOSE_BTN_CLASS = "sa-sprite-properties-close-btn";

  /** @type {HTMLElement} */
  let propertiesPanel;

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

  // Toggle the properties panel when double clicking in the sprite grid
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

  function setPropertiesPanelVisible(visible) {
    document.body.classList.toggle(SHOW_PROPS_CLASS, visible);
    document.body.classList.toggle(HIDE_PROPS_CLASS, !visible);
  }

  function togglePropertiesPanel() {
    const isCurrentlyOpen = document.body.classList.contains(SHOW_PROPS_CLASS);
    setPropertiesPanelVisible(!isCurrentlyOpen);
  }

  function autoHidePanel() {
    if (addon.settings.get("autoCollapse")) {
      setPropertiesPanelVisible(false);
    }
  }

  function applySettings() {
    autoHidePanel();
    setPropertiesPanelVisible(!addon.settings.get("hideByDefault"));
  }
  addon.settings.addEventListener("change", applySettings);
  applySettings();

  addon.self.addEventListener("disabled", () => {
    setPropertiesPanelVisible(true);
  });
  addon.self.addEventListener("reenabled", applySettings);

  function injectInfoButton(spriteIndex) {
    let selectedSprite;
    if (typeof spriteIndex === "number") {
      selectedSprite = document.querySelector(
        `[class*='sprite-selector_sprite-wrapper_']:nth-child(${spriteIndex}) [class*="sprite-selector_sprite_"]`
      );
    } else {
      selectedSprite = document.querySelector('[class*="sprite-selector-item_is-selected"]');
    }
    if (selectedSprite) {
      injectButton(selectedSprite, PROPS_INFO_BTN_CLASS, "/info.svg", msg("open-properties-panel-tooltip"));
    }
  }

  function injectCloseButton() {
    injectButton(propertiesPanel, PROPS_CLOSE_BTN_CLASS, "/collapse.svg", msg("close-properties-panel-tooltip"));
  }

  function injectButton(container, className, iconPath, tooltip) {
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

  function updateWideLocaleMode() {
    // Certain "wide" languages such as Japanese use a different layout for the sprite info panel
    // Easiest way to detect this is with this selector that only exists when the sprite info panel
    // is using the layout with text above the input.
    // Note that when the stage is in small mode, "wide" languages use the same info panel as other
    // languages.
    // List of languages is here:
    // https://github.com/LLK/scratch-gui/blob/e15b2dfa3a2e58e80fae8d1586c7f56aa0cc0ede/src/lib/locale-utils.js#L6-L18
    const isWideLocale = !!propertiesPanel.querySelector("[class^=label_input-group-column_]");
    document.body.classList.toggle("sa-sprite-properties-wide-locale", isWideLocale);
  }

  document.addEventListener(
    "click",
    (e) => {
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
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    updateWideLocaleMode();
    injectInfoButton();
    injectCloseButton();
  }
}
