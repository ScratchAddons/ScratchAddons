function handleUnsupported() {
  const checkIfUnsupported = () => {
    const getVersion = () => {
      let userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
      if (!userAgent) return { browser: null, version: null };
      return { browser: userAgent[1], version: userAgent[2].split(".")[0] };
    };

    let { browser, version } = getVersion();
    return (browser === "Chrome" && version < 81) || (browser === "Firefox" && version < 74);
  };
  if (checkIfUnsupported()) chrome.tabs.create({ url: "https://scratchaddons.com/unsupported" });
}
handleUnsupported();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === "checkIfUnsupported") handleUnsupported();
});
