export default async function ({ addon, console }) {
  document.body.addEventListener(
    "click",
    (e) => {
      if (addon.self.disabled) {
        return;
      }
      const mainButton = e.target.closest('[class*="action-menu_main-button_"]');
      if (mainButton) {
        const assetPanelWrapper = mainButton.closest("[class*=asset-panel_wrapper_]");
        if (assetPanelWrapper && assetPanelWrapper.querySelector("[class*=sound-editor_editor-container_]")) {
          return;
        }
        e.stopPropagation();
        const moreButtonsElement = mainButton.parentElement.querySelector('[class*="action-menu_more-buttons_"]');
        const moreButtons = moreButtonsElement.children;
        // use "second from last" to find the paint button for compatibility with HD image uploads
        const buttonToClick = moreButtons[moreButtons.length - 2];
        const elementToClick = buttonToClick.querySelector("button");
        elementToClick.click();
      }
    },
    {
      bubble: true,
    }
  );
}
