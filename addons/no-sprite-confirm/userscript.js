export default async ({ addon, console }) => {
  document.body.addEventListener("click", () => {
    setTimeout(() => {
      const confirmButton = document.querySelector("[class^='delete-confirmation-prompt_ok-button_']");
      if (!addon.self.disabled && confirmButton) confirmButton.click();
    }, 0)
  })
};
