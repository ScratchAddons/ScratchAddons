chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "sendContentScriptInfo") {
    chrome.tabs.sendMessage(sender.tab.id, "getInitialUrl", async (res) => {
      if (res) {
        chrome.tabs.sendMessage(sender.tab.id, { contentScriptInfo: await getContentScriptInfo(res) });
      }
    });
  }
  if (request === "openSettingsOnThisTab")
    chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL("webpages/settings/index.html") });
});

async function getContentScriptInfo(url) {
  const data = {
    url,
    globalState: {},
    addonsWithUserscripts: [],
    userstyleUrls: [],
    themes: [],
  };
  const fetchThemeStylesPromises = [];

  for (const { addonId, manifest } of scratchAddons.manifests) {
    if (!scratchAddons.localState.addonsEnabled[addonId]) continue;

    const userscripts = [];
    for (const script of manifest.userscripts || []) {
      if (userscriptMatches({ url }, script, addonId))
        userscripts.push({
          url: script.url,
          runAtComplete: typeof script.runAtComplete === "boolean" ? script.runAtComplete : true,
        });
    }
    if (userscripts.length) data.addonsWithUserscripts.push({ addonId, scripts: userscripts, traps: manifest.traps });

    if (manifest.tags.includes("theme")) {
      const styleUrls = [];
      for (const style of manifest.userstyles || []) {
        if (userscriptMatches({ url }, style, addonId)) styleUrls.push(style.url);
      }
      if (styleUrls.length) {
        const styles = [];
        data.themes.push({ addonId, styles });
        for (const styleUrl of styleUrls) {
          fetchThemeStylesPromises.push(
            fetch(chrome.runtime.getURL(`/addons/${addonId}/${styleUrl}`))
              .then((res) => res.text())
              .then((text) => styles.push(text))
          );
        }
      }
    } else {
      for (const style of manifest.userstyles || []) {
        if (userscriptMatches({ url }, style, addonId))
          data.userstyleUrls.push(chrome.runtime.getURL(`/addons/${addonId}/${style.url}`));
      }
    }
  }

  await Promise.all(fetchThemeStylesPromises);
  data.globalState = scratchAddons.globalState._target;

  return data;
}

// Key: int tabId, value: object { intervalId, messageListener }
const intervalsMap = new Map();
// In order to send information as soon as possible, data is sent in 3 ways:
// - Sending the data every 100ms
// - Sending the data straight away to that tab - won't work most times
// - Wait until the content script sends "ready" and and then send the data
chrome.webRequest.onBeforeRequest.addListener(
  async (request) => {
    if (intervalsMap.has(request.tabId)) {
      // This might happen with a redirect, we don't want to keep sending or listening for old data on the tab
      const info = intervalsMap.get(request.tabId);
      clearInterval(info.intervalId);
      chrome.runtime.onMessage.removeListener(info.messageListener);
    }

    const data = await getContentScriptInfo(request.url, request.tabId);

    const removeInterval = (tabId, intervalId, listener) => {
      clearInterval(intervalId);
      chrome.runtime.onMessage.removeListener(listener);
      if (intervalsMap.has(tabId) && intervalsMap.get(tabId).intervalId === intervalId) intervalsMap.delete(tabId);
    };

    let messageListener;

    let timesSent = 0;
    const interval = setInterval(() => {
      chrome.tabs.sendMessage(request.tabId, { contentScriptInfo: data }, (res) => {
        if (res) removeInterval(request.tabId, interval, messageListener);
      });
      timesSent++;
      if (timesSent === 300) removeInterval(request.tabId, interval, messageListener);
    }, 100);

    messageListener = (request, sender, sendResponse) => {
      if (request === "ready" && sender.tab.id === request.tabId) {
        chrome.tabs.sendMessage(
          request.tabId,
          { contentScriptInfo: data },
          (res) => res && removeInterval(request.tabId, interval, messageListener)
        );
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    intervalsMap.set(request.tabId, { intervalId: interval, messageListener });

    chrome.tabs.sendMessage(
      request.tabId,
      { contentScriptInfo: data },
      (res) => res && removeInterval(request.tabId, interval, messageListener)
    );
  },
  {
    urls: ["https://scratch.mit.edu/*"],
    types: ["main_frame"],
  }
);

scratchAddons.localEvents.addEventListener("themesUpdated", () => {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", async (res) => {
          if (res) {
            chrome.tabs.sendMessage(tab.id, { themesUpdated: (await getContentScriptInfo(res)).themes });
          }
        });
      }
    })
  );
});

function userscriptMatches(data, scriptOrStyle, addonId) {
  if (scriptOrStyle.settingMatch) {
    const { id, value } = scriptOrStyle.settingMatch;
    if (scratchAddons.globalState.addonSettings[addonId][id] !== value) return false;
  }
  const url = data.url;
  for (const match of scriptOrStyle.matches) {
    if (urlMatchesPattern(match, url)) return true;
  }
  return false;
}

function urlMatchesPattern(pattern, url) {
  const patternUrl = new URL(pattern);
  const urlUrl = new URL(url);
  // We assume both URLs start with https://scratch.mit.edu

  const patternPath = patternUrl.pathname.split("/");
  const urlPath = urlUrl.pathname.split("/");
  // Implicit slash at the end of the URL path, if it's not there
  if (urlPath[urlPath.length - 1] !== "") urlPath.push("");
  // Implicit slash at the end of the pattern, unless it's a wildcard
  if (patternPath[patternPath.length - 1] !== "" && patternPath[patternPath.length - 1] !== "*") patternPath.push("");

  while (patternPath.length) {
    // shift() removes the first item of an array, and returns it
    const patternItem = patternPath.shift();
    const urlItem = urlPath.shift();
    if (patternItem !== urlItem && patternItem !== "*") return false;
  }
  return true;
}
