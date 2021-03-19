export default async function ({ addon, global, console }) {
  async function droppable(dropAreaProm, fileInputProm) {
    const dropArea = await dropAreaProm;
    const fileInput = await fileInputProm;

    dropArea.addEventListener("drop", (e) => {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      e.preventDefault();
    });
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
  }

  droppable(
    addon.tab.waitForElement('div[class*="sprite-selector_sprite-selector"]'),
    addon.tab.waitForElement('div[class*="sprite-selector_sprite-selector"] input[class*="action-menu_file-input"]')
  );
  droppable(
    addon.tab.waitForElement('div[class*="stage-selector_stage-selector"]'),
    addon.tab.waitForElement('div[class*="stage-selector_stage-selector"] input[class*="action-menu_file-input"]')
  );

  while (true) {
    await droppable(
      addon.tab.waitForElement('div[class*="selector_wrapper"]', { markAsSeen: true }),
      addon.tab.waitForElement('div[class*="selector_wrapper"] input[class*="action-menu_file-input"]', {
        markAsSeen: true,
      })
    );
  }
}
