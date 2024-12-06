export default async ({ addon, console }) => {
  while (true) {
    const confirmButton = await addon.tab.waitForElement("[class^='delete-confirmation-prompt_ok-button_']", { markAsSeen: true });
    if (!addon.self.disabled) confirmButton.click();
  }
};

