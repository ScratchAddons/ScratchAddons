if (scratchAddons.localState.allReady) getUserscripts();
else scratchAddons.localEvents.addEventListener("ready", getUserscripts);

const addonsWithScriptsOrStyles = [];
async function getUserscripts() {
  for (const { manifest, addonId } of scratchAddons.manifests) {
    if (manifest.userscripts || manifest.userstyles) {
      addonsWithScriptsOrStyles.push({
        addonId,
        scripts: manifest.userscripts || [],
        styles: manifest.userstyles || [],
      });
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getGlobalState") sendResponse(scratchAddons.globalState._target);
  // Firefox breaks if we send a proxy
  else if (request === "openSettingsOnThisTab")
    chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL("webpages/settings/index.html") });
});

async function sendUserscriptsAndUserstyles(url, tabId) {
  if (new URL(url).origin !== "https://scratch.mit.edu") return;
  const data = [];
  for (const addon of addonsWithScriptsOrStyles) {
    if (!scratchAddons.localState.addonsEnabled[addon.addonId]) continue;
    const scripts = [];
    const styleUrls = [];
    for (const script of addon.scripts) {
      if (userscriptMatches({ url }, script, addon.addonId))
        scripts.push({
          url: script.url,
          runAtComplete: typeof script.runAtComplete === "boolean" ? script.runAtComplete : true,
        });
    }
    for (const style of addon.styles) {
      if (userscriptMatches({ url }, style, addon.addonId)) styleUrls.push(style.url);
    }
    if (scripts.length || styleUrls.length) data.push({ addonId: addon.addonId, scripts, styleUrls, styles: [] });
  }

  const promises = [];
  for (const addon of data) {
    for (const i in addon.styleUrls) {
      promises.push(
        fetch(chrome.runtime.getURL(`/addons/${addon.addonId}/${addon.styleUrls[i]}`))
          .then((res) => res.text())
          .then((text) => (addon.styles[i] = text))
      );
    }
  }

  await Promise.all(promises);
  let receivedResponse = false;
  chrome.tabs.sendMessage(tabId, { userscriptsAndUserstyles: data }, (res) => res && (receivedResponse = true));
  setTimeout(() => {
    if (!receivedResponse) {
      const interval = setInterval(
        () =>
          chrome.tabs.sendMessage(tabId, { userscriptsAndUserstyles: data }, (res) => res && clearInterval(interval)),
        250
      );
      setTimeout(() => clearInterval(interval), 30000);
    }
  }, 1000);
}
chrome.webNavigation.onCommitted.addListener((request) => sendUserscriptsAndUserstyles(request.url, request.tabId), {
  url: [{ hostEquals: "scratch.mit.edu" }],
});
scratchAddons.localEvents.addEventListener("themesUpdated", () => {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", (res) => {
          if (res) sendUserscriptsAndUserstyles(res, tab.id);
        });
      }
    })
  );
});

function userscriptMatches(data, scriptOrStyle, addonId) {
  if (scriptOrStyle.setting_match) {
    const { setting_id, setting_value } = scriptOrStyle.setting_match;
    if (scratchAddons.globalState.addonSettings[addonId][setting_id] !== setting_value) return false;
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
