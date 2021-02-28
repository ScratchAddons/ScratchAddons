chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, patch] = currentVersion.split(".");
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: "https://scratchaddons.com/scratch-messaging-transition" });
  } else if (
    details.reason === "install" &&
    chrome.runtime.getManifest().version_name.includes("-prerelease") === false
  ) {
    chrome.tabs.create({ url: "https://scratchaddons.com/welcome" });
  }

  if (details.reason === "install") {
    chrome.storage.local.set({
      bannerSettings: { lastShown: `${major}.${minor}` },
    });
  }
});
if (chrome.runtime.getManifest().version_name.includes("-prerelease") === false) {
  chrome.runtime.setUninstallURL("https://scratchaddons.com/farewell");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.messageFromUS) {
    const attrVal = request.messageFromUS;
    scratchAddons.eventTargets[attrVal.target].forEach((eventTarget) => {
      eventTarget.dispatchEvent(new CustomEvent(attrVal.name, { detail: attrVal.data || {} }));
    });
  }
});
