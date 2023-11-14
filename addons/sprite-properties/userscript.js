export default async function ({ addon, console, msg }) {
  const SHOW_PROPS_CLASS = "sa-show-sprite-properties";
  const HIDE_PROPS_CLASS = "sa-hide-sprite-properties";
  const PROPS_INFO_BTN_CLASS = "sa-sprite-properties-info-btn";
  const PROPS_CLOSE_BTN_CLASS = "sa-sprite-properties-close-btn";

  /** @type {HTMLElement} */
  let propertiesPanel;

  // A mutation observer is the only reliable way to detect when a different sprite has
  // been selected or when the folder that contains the focused sprite has been opened.
  const observer = new MutationObserver(() => {
    injectInfoButton();
  });

  // Toggle the properties panel when double clicking in the sprite grid
  document.addEventListener("click", (e) => {
    if (e.detail === 2 && e.target.closest('[class^="sprite-selector_scroll-wrapper_"]')) {
      togglePropertiesPanel();
    }
  });

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
  const isDirectionPopoverOpen = () =>
    document.querySelector("body > div.Popover > div > div > [class*=direction-picker_button-row_]");
  // Close properties panel when mouse leaves the entire sprite panel
  document.body.addEventListener(
    "mouseleave",
    (e) => {
      if (e.target.matches('[class*="sprite-selector_sprite-selector_"]')) {
        if (!isDirectionPopoverOpen()) autoHidePanel();
      }
    },
    {
      capture: true,
    }
  );
  addon.settings.addEventListener("change", autoHidePanel);

  function applySettings() {
    const visibleByDefault = !addon.settings.get("autoCollapse") && !addon.settings.get("hideByDefault");
    setPropertiesPanelVisible(visibleByDefault);
  }
  addon.self.addEventListener("reenabled", applySettings);
  applySettings();

  addon.self.addEventListener("disabled", () => {
    setPropertiesPanelVisible(true);
  });

  function createButton(className, iconPath, tooltip) {
    const buttonIcon = document.createElement("img");
    buttonIcon.setAttribute("src", addon.self.dir + iconPath);
    buttonIcon.draggable = false;
    const button = document.createElement("button");
    button.classList.add(className);
    button.title = tooltip;
    button.addEventListener("click", () => togglePropertiesPanel());
    button.appendChild(buttonIcon);
    addon.tab.displayNoneWhileDisabled(button, { display: "flex" });
    return button;
  }

  /** @type {HTMLElement} */
  let infoButton;
  /** @type {HTMLElement} */
  let closeButton;

  function injectInfoButton() {
    if (!infoButton) {
      infoButton = createButton(PROPS_INFO_BTN_CLASS, "/info.svg", msg("open-properties-panel-tooltip"));
    }
    const selectedSprite = propertiesPanel.parentNode.querySelector('[class*="sprite-selector-item_is-selected"]');
    if (infoButton.parentNode !== selectedSprite) {
      if (selectedSprite) {
        selectedSprite.appendChild(infoButton);
      } else {
        infoButton.remove();
      }
    }
  }

  function injectCloseButton() {
    if (!closeButton) {
      closeButton = createButton(PROPS_CLOSE_BTN_CLASS, "/collapse.svg", msg("close-properties-panel-tooltip"));
    }
    propertiesPanel.appendChild(closeButton);
  }

  function updateWideLocaleMode() {
    // Certain "wide" languages such as Japanese use a different layout for the sprite info panel
    // Easiest way to detect this is with this selector that only exists when the sprite info panel
    // is using the layout with text above the input.
    // Note that when the stage is in small mode, "wide" languages use the same info panel as other
    // languages.
    // List of languages is here:
    // https://github.com/scratchfoundation/scratch-gui/blob/e15b2dfa3a2e58e80fae8d1586c7f56aa0cc0ede/src/lib/locale-utils.js#L6-L18
    const isWideLocale = !!propertiesPanel.querySelector("[class^=label_input-group-column_]");
    document.body.classList.toggle("sa-sprite-properties-wide-locale", isWideLocale);
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/StageSize/SET_STAGE_SIZE") {
      setTimeout(updateWideLocaleMode);
    }
  });

  while (true) {
    propertiesPanel = await addon.tab.waitForElement('[class^="sprite-info_sprite-info_"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    const spriteSelector = propertiesPanel.parentNode;
    const itemsWrapper = spriteSelector.querySelector('[class*="sprite-selector_items-wrapper_"]');
    observer.observe(itemsWrapper, {
      childList: true,
      subtree: true,
    });

    updateWideLocaleMode();
    injectInfoButton();
    injectCloseButton();
  }
}
