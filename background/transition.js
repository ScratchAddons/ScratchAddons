const utm = `utm_source=extension&utm_medium=tabscreate&utm_campaign=v${chrome.runtime.getManifest().version}`;
// Note: chrome.i18n.getUILanguage is not available Chrome 96-99
const uiLanguage = (chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || navigator.language;
const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
chrome.runtime.onInstalled.addListener(async (details) => {
  const normalInstall = (await chrome.management.getSelf()).installType === "normal";
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  if (details.reason === "install") {
    if (normalInstall) {
      chrome.tabs.create({ url: `https://scratchaddons.com/${localeSlash}welcome/?${utm}` });
    }
    chrome.storage.local.set({
      bannerSettings: { lastShown: `${major}.${minor}` },
    });
  }
  if (normalInstall) {
    chrome.runtime.setUninstallURL(`https://scratchaddons.com/${localeSlash}farewell?${utm}`);
  }
});
