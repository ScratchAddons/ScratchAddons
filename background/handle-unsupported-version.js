function unsupportedBrowser() {
  const userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
  if (!userAgent || !userAgent[1] || !userAgent[2]) return false;
  const browser = userAgent[1];
  const version = +(userAgent[2].split(".")[0] || Infinity);

  return (browser === "Chrome" && version < 80) || (browser === "Firefox" && version < 74);
}

if (unsupportedBrowser()) {
  chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request === "checkIfUnsupported") {
      if (sender.tab) chrome.tabs.update(sender.tab.id, { url: "https://scratchaddons.com/unsupported-browser" });
      else chrome.tabs.create({ url: "https://scratchaddons.com/unsupported-browser" });
    }
  });
}
