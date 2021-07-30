const checkIfUnsupported = () => {
  const getVersion = () => {
    let userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
    if (!userAgent) return { browser: null, version: null };
    return { browser: userAgent[1], version: userAgent[2].split(".")[0] };
  };

  let { browser, version } = getVersion();
  return (browser === "Chrome" && version < 80) || (browser === "Firefox" && version < 74);
};

if (checkIfUnsupported()) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === "checkIfUnsupported") {
      const uiLanguage = chrome.i18n.getUILanguage();
      const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
      const utm = `utm_source=extension&utm_medium=tabscreate&utm_campaign=v${chrome.runtime.getManifest().version}`;
      const url = `https://scratchaddons.com/${localeSlash}unsupported-browser/?${utm}`;
      if (sender.tab) chrome.tabs.update(sender.tab.id, { url });
      else chrome.tabs.create({ url });
    }
  });
}
