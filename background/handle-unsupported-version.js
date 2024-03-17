const checkIfUnsupported = () => {
  const getVersion = () => {
    let userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
    if (!userAgent) return { browser: null, version: null };
    return { browser: userAgent[1], version: userAgent[2].split(".")[0] };
  };

  let { browser, version } = getVersion();
  const MIN_CHROME_VERSION = 96;
  const MIN_FIREFOX_VERSION = 109;
  return (
    (browser === "Chrome" && version < MIN_CHROME_VERSION) || (browser === "Firefox" && version < MIN_FIREFOX_VERSION)
  );
};

if (checkIfUnsupported()) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === "checkIfUnsupported") {
      const url = chrome.runtime.getURL("webpages/error/unsupported-browser.html");
      if (sender.tab) chrome.tabs.update(sender.tab.id, { url });
      else chrome.tabs.create({ url });
    }
  });
}
