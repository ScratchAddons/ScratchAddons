export default async function ({ addon, console }) {
  const getButtonToClick = (mainButton) => {
    let index;
    const indexes = {
      upload: 0,
      surprise: 1,
      paint: 2,
      record: 2,
      library: 3
    };
    const assetPanelWrapper = mainButton.closest("[class*=asset-panel_wrapper_]");
    if (assetPanelWrapper) {
      if (assetPanelWrapper.querySelector("[class*=sound-editor_editor-container_]")) {
        index = indexes[addon.settings.get("sound")];
      } else {
        index = indexes[addon.settings.get("costume")];
      }
    } else if (mainButton.closest("[class*=target-pane_stage-selector-wrapper]")) {
      index = indexes[addon.settings.get("backdrop")];
    } else {
      index = indexes[addon.settings.get("sprite")];
    }
    if (typeof index !== 'number') {
      // should never happen
      return;
    }
    const moreButtonsElement = mainButton.parentElement.querySelector('[class*="action-menu_more-buttons_"]');
    const moreButtons = moreButtonsElement.children;
    // Search from end of array for compatibility with better-img-uploads
    const buttonToClick = moreButtons[moreButtons.length - (4 - index)];
    return buttonToClick;
  };
  document.body.addEventListener(
    "click",
    (e) => {
      if (addon.self.disabled) {
        return;
      }
      const mainButton = e.target.closest('[class*="action-menu_main-button_"]');
      if (!mainButton) {
        return;
      }
      const buttonToClick = getButtonToClick(mainButton);
      if (!buttonToClick) {
        return;
      }
      e.stopPropagation();
      const elementToClick = buttonToClick.querySelector("button");
      elementToClick.click();
    },
    {
      bubble: true,
    }
  );
}
