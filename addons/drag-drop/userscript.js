export default async function ({ addon, global, console }) {
  const DRAG_AREA_CLASS = "sa-drag-area";
  const DRAG_OVER_CLASS = "sa-dragged-over";

  async function droppable(dropAreaProm, fileInputProm, dragOverClass) {
    const dropArea = await dropAreaProm;
    const fileInput = await fileInputProm;
    dropArea.classList.add(DRAG_AREA_CLASS);

    dropArea.addEventListener("drop", (e) => {
      fileInput.files = e.dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      dropArea.classList.remove(DRAG_OVER_CLASS);
      e.preventDefault();
    });
    dropArea.addEventListener("dragover", (e) => {
      dropArea.classList.add(DRAG_OVER_CLASS);
      e.preventDefault();
    });
    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove(DRAG_OVER_CLASS);
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
