export default async ({ addon, console }) => {
  document.body.addEventListener("pointerup", () => {
    setTimeout(() => {
      const confirmButton = document.querySelector("[class*='confirmation-prompt_modal-container_'] [class*='confirmation-prompt_confirm-button_']");
      if (!addon.self.disabled && confirmButton) confirmButton.click();
    }, 0);
  });
};
