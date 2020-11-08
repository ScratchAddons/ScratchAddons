chrome.runtime.onInstalled.addListener((details) => {
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  } else if (
    details.reason === "install" &&
    chrome.runtime.getManifest().version_name.includes("-prerelease") === false
  ) {
    chrome.tabs.create({ url: "https://scratchaddons.com/welcome" });
  }

  // TODO: remove in v1.4.0
  // Disable live featured projects for all users
  if (details.previousVersion && details.previousVersion === "1.3.0" && chrome.runtime.getManifest().version === "1.3.1") {
    scratchAddons.localEvents.addEventListener("ready", () => {
      scratchAddons.localState.addonsEnabled["live-featured-project"] = false;
      chrome.storage.sync.set({
        addonsEnabled: scratchAddons.localState.addonsEnabled,
      });
    });
  }
});
chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
