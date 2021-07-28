function getExtensionLocale() {
  let locale = chrome.i18n.getUILanguage().toLowerCase();
  if (locale.includes("-")) locale = locale.split("-")[0];
  if (locale.startsWith("pt")) locale = "pt-br";
  return locale;
}
chrome.runtime.onInstalled.addListener(async (details) => {
  const locale = getExtensionLocale();
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  if (details.previousVersion && details.previousVersion.startsWith("0")) {
    const url =
      locale == "en"
        ? "https://scratchaddons.com/scratch-messaging-transition"
        : `https://scratchaddons.com/${locale}/scratch-messaging-transition`;
    chrome.tabs.create({ url });
  } else if (
    details.reason === "install" &&
    chrome.runtime.getManifest().version_name.includes("-prerelease") === false
  ) {
    const url = locale == "en" ? "https://scratchaddons.com/welcome" : `https://scratchaddons.com/${locale}/welcome`;
    chrome.tabs.create({ url });
  }

  if (details.reason === "install") {
    chrome.storage.local.set({
      bannerSettings: { lastShown: `${major}.${minor}` },
    });
  }
});
if (chrome.runtime.getManifest().version_name.includes("-prerelease") === false) {
  let locale = getExtensionLocale();
  const uninstallURL =
    locale == "en" ? "https://scratchaddons.com/farewell" : `https://scratchaddons.com/${locale}/farewell`;
  chrome.runtime.setUninstallURL(uninstallURL);
}
