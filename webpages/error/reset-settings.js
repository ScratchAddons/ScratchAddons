document.querySelector("#reset-settings-btn").onclick = () => {
  if (!window.exportedSettings) {
    const res = confirm(
      "Are you sure you want to CLEAR ALL SETTINGS? If you haven't exported your settings first, click Cancel."
    );
    if (!res) return;
    const res2 = prompt("Type 123 to confirm. You will lose all your Scratch Addons settings.");
    if (res2 !== "123") {
      alert("You did not type 123. Did not reset settings.");
      return;
    }
  }

  try {
    chrome.storage.local.clear();
  } catch (err) {}
  try {
    chrome.storage.sync.clear();
  } catch (err) {}
  try {
    localStorage.clear();
  } catch (err) {}
  try {
    (async () => {
      const dbs = await window.indexedDB.databases();
      dbs.forEach((db) => {
        window.indexedDB.deleteDatabase(db.name);
      });
    })();
  } catch (err) {}

  setTimeout(() => {
    alert("All settings were reset. The extension will reload.");
    chrome.runtime.reload();
  }, 1500)
};
