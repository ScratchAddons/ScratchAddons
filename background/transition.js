chrome.storage.sync.get(["developerMode"], (r) => {
  const developerMode =
    r.developerMode === "always" ||
    (r.developerMode === undefined && chrome.runtime.getManifest().version_name.endsWith("-prerelease"));
  chrome.runtime.onInstalled.addListener(async (details) => {
    const currentVersion = chrome.runtime.getManifest().version;
    const [major, minor, patch] = currentVersion.split(".");
    if (details.previousVersion && details.previousVersion.startsWith("0")) {
      chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
    } else if (details.reason === "install" && !developerMode) {
      chrome.tabs.create({ url: "https://scratchaddons.com/welcome" });
    }

    if (details.reason === "install") {
      chrome.storage.local.set({
        bannerSettings: { lastShown: `${major}.${minor}` },
      });
    }
  });
  if (!isDevVersion) {
    chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
  }
});
