export default async function ({ addon, global, console }) {
  const DRAG_AREA_CLASS = "sa-drag-area";
  const DRAG_OVER_CLASS = "sa-dragged-over";

  function droppable(dropArea, onDrop) {
    dropArea.classList.add(DRAG_AREA_CLASS);
    dropArea.addEventListener("drop", (e) => {
      onDrop(e.dataTransfer.files);
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

  async function foreverDroppable(dropAreaSelector, fileInputSelector) {
    while (true) {
      const dropArea = await addon.tab.waitForElement(dropAreaSelector, { markAsSeen: true });
      const fileInput = await addon.tab.waitForElement(fileInputSelector, {
        markAsSeen: true,
      });
      droppable(dropArea, files => {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  }

  // Sprite selector
  foreverDroppable(
    'div[class*="sprite-selector_sprite-selector"]',
    'div[class*="sprite-selector_sprite-selector"] input[class*="action-menu_file-input"]'
  );

  // Stage selector
  foreverDroppable(
    'div[class*="stage-selector_stage-selector"]',
    'div[class*="stage-selector_stage-selector"] input[class*="action-menu_file-input"]'
  );

  // Costume/sound asset list
  foreverDroppable(
    'div[class*="selector_wrapper"]',
    'div[class*="selector_wrapper"] input[class*="action-menu_file-input"]'
  );

  async function listWatchersDroppable() {
    while (true) {
      const listMonitor = await addon.tab.waitForElement('div[class*="monitor_list-monitor"]', { markAsSeen: true });
      droppable(listMonitor, async files => {
        // Simulate a right click on the list monitor
        listMonitor.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
        // Get the right click menu that opened (monitor context menus are
        // children of <body>)
        const contextMenu = await addon.tab.waitForElement('body > .react-contextmenu.react-contextmenu--visible');
        // Override DOM methods to import the text file directly
        // See: https://github.com/LLK/scratch-gui/blob/develop/src/lib/import-csv.js#L21-L22
        const appendChild = document.body.appendChild;
        document.body.appendChild = (fileInput) => {
          // Restore appendChild to <body>
          document.body.appendChild = appendChild;
          document.body.appendChild(fileInput);
          // Prevent Scratch from opening the file input dialog
          fileInput.click = () => {};
          // Insert files from the drop event into the file input
          fileInput.files = files;
          fileInput.dispatchEvent(new Event('change'));
        };
        // Simulate clicking on the "Import" option
        contextMenu.children[0].click();
      });
    }
  }

  listWatchersDroppable();
}
