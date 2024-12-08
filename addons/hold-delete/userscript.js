export default async function ({ addon, console }) {
  const DELETE_BUTTON_SELECTOR =
    "[class^='sprite-selector_items-wrapper_'] [class*='sprite-selector-item_delete-button']";
  let deleteButton;
  let holding = false;

  document.body.addEventListener("mousedown", async (e) => {
    if (addon.self.disabled) return;

    const potentialDeleteButton = e.target.closest(DELETE_BUTTON_SELECTOR);
    // If we haven't already, then...
    if (e.target !== deleteButton && potentialDeleteButton) {
      e.stopImmediatePropagation();
      deleteButton = potentialDeleteButton;
      setUpPressAndHold(); // ...set up this delete button.
    }
  });

  /** Do a one-time setup for the press-and-hold logic per delete button. */
  const setUpPressAndHold = () => {
    startHold(deleteButton);

    // Prevent the user from activating the delete button
    deleteButton.addEventListener("click", (e) => {
      if (addon.self.disabled) return;

      if (e.isTrusted) {
        e.stopImmediatePropagation();
      } else if (addon.settings.get("noConfirm")) {
        setTimeout(() => {
          const confirmButton = document.querySelector("[class^='delete-confirmation-prompt_ok-button_']");
          if (confirmButton) confirmButton.click();
        }, 0);
      }
    });

    deleteButton.addEventListener("mousedown", async (e) => {
      if (addon.self.disabled) return;

      e.stopImmediatePropagation();
      startHold(deleteButton);
    });

    async function startHold(deleteButton) {
      holding = true;

      // Wait out the hold delay
      for (let i = 0; i < 100; i += 2) {
        if (!holding) break;
        deleteButton.firstElementChild.style.background = `linear-gradient(0deg, #ff8c1a, #ff8c1a ${i}%, var(--editorDarkMode-primary, #855cd6) ${i}%)`;
        await new Promise((resolve) => setTimeout(resolve, 17));
      }

      deleteButton.firstElementChild.style.transition = "none";
      deleteButton.firstElementChild.style.removeProperty("background");
      setTimeout(() => deleteButton.firstElementChild.style.removeProperty("transition"), 10);

      // Then delete the sprite
      if (holding) deleteButton.click();
    }
  };

  // Cancel if released
  document.body.addEventListener("mouseup", async () => {
    holding = false;
  });
  // Cancel if image dragged
  document.body.addEventListener("dragstart", async () => {
    holding = false;
  });
}
