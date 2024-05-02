globalThis.MANIFEST_VERSION = 2;

if (globalThis.MANIFEST_VERSION === 3) {
  chrome.browserAction = chrome.action;
}

const utm = `utm_source=extension&utm_medium=tabscreate&utm_campaign=v${chrome.runtime.getManifest().version}`;
const uiLanguage = chrome.i18n.getUILanguage();
const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: `https://scratchaddons.com/${localeSlash}scratch-messaging-transition/?${utm}` });
  } else if (
    details.reason === "install" &&
    chrome.runtime.getManifest().version_name.includes("-prerelease") === false
  ) {
    chrome.tabs.create({ url: `https://scratchaddons.com/${localeSlash}welcome/?${utm}` });
  }

  if (details.reason === "install") {
    chrome.storage.local.set({
      bannerSettings: { lastShown: `${major}.${minor}` },
    });
  }
});
if (chrome.runtime.getManifest().version_name.includes("-prerelease") === false) {
  chrome.runtime.setUninstallURL(`https://scratchaddons.com/${localeSlash}farewell?${utm}`);
}
