chrome.runtime.onInstalled.addListener((details) => {
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  } else if (
    details.reason === "install" &&
    chrome.runtime.getManifest().version_name.includes("-prerelease") === false
  ) {
    chrome.tabs.create({ url: "https://scratchaddons.com/welcome" });
  }

  if (details.reason === "install" && chrome.runtime.getManifest().version.startsWith("1.5.")) {
    // Avoid showing update notification to new users
    chrome.storage.sync.set({ "v1.5.0-banner": true });
  }
});
chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
