chrome.runtime.onInstalled.addListener((details) => {
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  }
});
chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
