chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "sendContentScriptInfo") {
    chrome.tabs.sendMessage(sender.tab.id, "getInitialUrl", { frameId: sender.tab.frameId }, async (res) => {
      if (res) {
        chrome.tabs.sendMessage(sender.tab.id, { contentScriptInfo: await getContentScriptInfo(res) });
      }
    });
  }
  if (request === "openSettingsOnThisTab")
    chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL("webpages/settings/index.html") });
});

function getL10NURLs() {
  const langCode = scratchAddons.globalState.auth.scratchLang.toLowerCase();
  const urls = [chrome.runtime.getURL(`addons-l10n/${langCode}`)];
  if (langCode === "pt") {
    urls.push(chrome.runtime.getURL(`addons-l10n/pt-br`));
  }
  if (langCode.includes("-")) {
    urls.push(chrome.runtime.getURL(`addons-l10n/${langCode.split("-")[0]}`));
  }
  const enJSON = chrome.runtime.getURL("addons-l10n/en");
  if (!urls.includes(enJSON)) urls.push(enJSON);
  return urls;
}

async function getContentScriptInfo(url) {
  const data = {
    url,
    l10njson: getL10NURLs(),
    globalState: {},
    allAddons: [],
    addonsWithUserscripts: [],
    addonsWithUserstyles: [],
    themes: [],
  };
  const fetchThemeStylesPromises = [];

  for (const { addonId, manifest } of scratchAddons.manifests) {
    const userscripts = [];
    for (const script of manifest.userscripts || []) {
      if (userscriptMatches({ url }, script, addonId))
        userscripts.push({
          url: script.url,
          runAtComplete: typeof script.runAtComplete === "boolean" ? script.runAtComplete : true,
        });
    }
    if (userscripts.length) data.allAddons.push({ addonId, scripts: userscripts });
    if (!scratchAddons.localState.addonsEnabled[addonId]) continue;
    if (userscripts.length) data.addonsWithUserscripts.push({ addonId, scripts: userscripts });

    if (manifest.tags.includes("theme")) {
      const styleUrls = [];
      for (const style of manifest.userstyles || []) {
        if (userscriptMatches({ url }, style, addonId)) styleUrls.push(style.url);
      }
      if (styleUrls.length) {
        const styles = {};
        data.themes.push({ addonId, styleUrls, styles });
        for (const styleUrl of styleUrls) {
          fetchThemeStylesPromises.push(
            fetch(chrome.runtime.getURL(`/addons/${addonId}/${styleUrl}`))
              .then((res) => res.text())
              .then((text) => {
                styles[styleUrl] = text;
              })
          );
        }
      }
    } else {
      const userstyles = [];
      for (const style of manifest.userstyles || []) {
        if (userscriptMatches({ url }, style, addonId))
          userstyles.push({
            url: chrome.runtime.getURL(`/addons/${addonId}/${style.url}`),
          });
      }
      if (userstyles.length) data.addonsWithUserstyles.push({ addonId, styles: userstyles });
    }
  }

  await Promise.all(fetchThemeStylesPromises);
  data.globalState = scratchAddons.globalState._target;

  return data;
}

// Key: string tabId+','+frameId, value: object { intervalId, messageListener }
const intervalsMap = new Map();
window.intervalsMap = intervalsMap;
// In order to send information as soon as possible, data is sent in 3 ways:
// - Sending the data every 100ms
// - Sending the data straight away to that tab - won't work most times
// - Wait until the content script sends "ready" and and then send the data
chrome.webRequest.onBeforeRequest.addListener(
  async (request) => {
    if (request.type === "sub_frame") {
      // Make sure this iframe is inside scratch.mit.edu, to avoid creating an interval.
      // If the iframe is 3rd party, we'll never get any messages or responses.
      try {
        await new Promise((resolve, reject) => {
          // Message the main frame of the tab, if we get a response, it's scratch.mit.edu
          chrome.tabs.sendMessage(request.tabId, "getInitialUrl", { frameId: 0 }, (res) => {
            if (res) resolve();
          });
          setTimeout(reject, 500);
        });
      } catch {
        return;
      }
    }
    if (intervalsMap.has(`${request.tabId},${request.frameId}`)) {
      // This might happen with a redirect, we don't want to keep sending or listening for old data on the tab
      const info = intervalsMap.get(`${request.tabId},${request.frameId}`);
      clearInterval(info.intervalId);
      chrome.runtime.onMessage.removeListener(info.messageListener);
    }

    const data = await getContentScriptInfo(request.url);

    const removeInterval = (mapKey, intervalId, listener) => {
      clearInterval(intervalId);
      chrome.runtime.onMessage.removeListener(listener);
      if (intervalsMap.has(mapKey) && intervalsMap.get(mapKey).intervalId === intervalId) intervalsMap.delete(mapKey);
    };

    let messageListener;

    let timesSent = 0;
    const interval = setInterval(() => {
      chrome.tabs.sendMessage(request.tabId, { contentScriptInfo: data }, { frameId: request.frameId }, (res) => {
        if (res) removeInterval(`${request.tabId},${request.frameId}`, interval, messageListener);
      });
      timesSent++;
      if (timesSent === 300) removeInterval(`${request.tabId},${request.frameId}`, interval, messageListener);
    }, 100);

    messageListener = (request, sender, sendResponse) => {
      if (
        request === "ready" &&
        sender.tab.id === request.tabId &&
        sender.tab.frameId === requestAnimationFrame.frameId
      ) {
        chrome.tabs.sendMessage(
          request.tabId,
          { contentScriptInfo: data },
          { frameId: request.frameId },
          (res) => res && removeInterval(request.tabId, interval, messageListener)
        );
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    intervalsMap.set(`${request.tabId},${request.frameId}`, { intervalId: interval, messageListener });

    chrome.tabs.sendMessage(
      request.tabId,
      { contentScriptInfo: data },
      { frameId: request.frameId },
      (res) => res && removeInterval(request.tabId, interval, messageListener)
    );
  },
  {
    urls: ["https://scratch.mit.edu/*"],
    types: ["main_frame", "sub_frame"],
  }
);

scratchAddons.localEvents.addEventListener("addonsUpdated", () => {
  // Only non-frames are updated
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, async (res) => {
          if (res) {
            chrome.tabs.sendMessage(tab.id, { addonsUpdated: await getContentScriptInfo(res) }, { frameId: 0 });
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
