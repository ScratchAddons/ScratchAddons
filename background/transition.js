chrome.runtime.onInstalled.addListener((details) => {
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  }
  else if(details.reason === "install") {
    chrome.tabs.create({ url: "https://scratchaddons.com/welcome" });
  }
});
chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
