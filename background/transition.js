const utm = `utm_source=extension&utm_medium=tabscreate&utm_campaign=v${chrome.runtime.getManifest().version}`;
// Note: chrome.i18n.getUILanguage is not available Chrome 96-99
const uiLanguage = (chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || navigator.language;
const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
const developerMode = await new Promise((resolve) => {
  chrome.management.getSelf((result) => {
    resolve(result.installType === "development");
  });
});
chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    chrome.tabs.create({ url: `https://scratchaddons.com/${localeSlash}scratch-messaging-transition/?${utm}` });
  } else if (details.reason === "install" && !developerMode) {
    chrome.tabs.create({ url: `https://scratchaddons.com/${localeSlash}welcome/?${utm}` });
  }

  if (details.reason === "install") {
    chrome.storage.local.set({
      bannerSettings: { lastShown: `${major}.${minor}` },
    });
  }
});
if (!developerMode) {
  chrome.runtime.setUninstallURL(`https://scratchaddons.com/${localeSlash}farewell?${utm}`);
}
