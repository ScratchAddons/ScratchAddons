(async () => {
  const src = chrome.extension.getURL("libraries/common/global-theme.js");
  const contentScript = await import(src);
  contentScript.default();
  chrome.storage.sync.get(["themeSetting"], ({ themeSetting = null }) => {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
      if (themeSetting !== "auto") {
        return;
      }
      contentScript.default();
    });
    setInterval(function () {
      if (themeSetting !== "time") {
        return;
      }
      contentScript.default();
    }, 60000);
  });
})();
