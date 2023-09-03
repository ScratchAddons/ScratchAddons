document.querySelector("#reset-settings-btn").onclick = () => {
  // TODO: if (!window.exportedSettings) after error page gets an "export settings" button.
  if (true) {
    const res = confirm(
      "Are you sure you want to CLEAR ALL SETTINGS? If you haven't exported your settings first, click Cancel."
    );
    if (!res) return;
    const res2 = prompt("Type 123 to confirm. You will lose all your Scratch Addons settings.");
    if (res2 !== "123") {
      alert("Settings were NOT reset.");
      return;
    }
  }

  try {
    chrome.storage.local.clear();
  } catch (err) {
    console.error(err);
  }
  try {
    chrome.storage.sync.clear();
  } catch (err) {
    console.error(err);
  }
  try {
    localStorage.clear();
  } catch (err) {
    console.error(err);
  }
  try {
    // We should try to list all IndexedDB databases here so that
    // we can actually clear them all in Firefox.
    const IDB_DATABASES = ["notifier", "messaging"];

    (async () => {
      const dbs = window.indexedDB.databases ? await window.indexedDB.databases() : null;
      const dbNames = !dbs ? IDB_DATABASES : dbs.map((db) => db.name);
      dbNames.forEach((name) => {
        window.indexedDB.deleteDatabase(name);
      });
    })();
  } catch (err) {
    console.error(err);
  }

  setTimeout(() => {
    alert("All settings were reset. The extension will reload.");
    chrome.runtime.reload();
  }, 1500);
};
