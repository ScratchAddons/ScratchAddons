chrome.runtime.onInstalled.addListener((details) => {
  if (details.previousVersion && details.previousVersion !== "1.0.0") {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  }
});
