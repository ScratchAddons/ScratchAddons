export default async function ({ addon, global, console }) {
  window.addon = addon

  const spriteSelector = await addon.tab.waitForElement('div[class*="sprite-selector_scroll-wrapper"]');
  const spriteUpload = await addon.tab.waitForElement('input[class*="action-menu_file-input"]');
  spriteSelector.addEventListener('drop', e => {
    spriteUpload.files = e.dataTransfer.files;
    spriteUpload.dispatchEvent(new Event('change', { bubbles: true }));
    e.preventDefault();
  });
  spriteSelector.addEventListener('dragover', e => {
    e.preventDefault();
  });
}
