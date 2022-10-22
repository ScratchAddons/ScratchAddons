export default async function({ addon, global, console }) {
  function loadRows(rowData) {
    const rowJSON = rowData;
    const rows = document.querySelectorAll('div.box');
    for (let i = 0; i < rowJSON.length; i++) {
      if (rowJSON[i].rowVisibility) {
        rows[i].style.display = 'inline-block';
        rows[i].children[0].children[0].textContent = rowJSON[i].rowName;
      } else {
        rows[i].style.display = 'none';
      }
    }
  }

  while (true) {
    await addon.tab.waitForElement('div.activity', {
      markAsSeen: true,
    });
    const rowJSON = addon.settings.get('rowData');
    loadRows(rowJSON);
  }
}