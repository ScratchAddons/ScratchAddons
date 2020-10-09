chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "openSettingsOnThisTab")
    chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL("webpages/settings/index.html") });
});

async function getContentScriptInfo(url, tabId) {
  const data = {
    globalState: {},
    addonsWithUserscripts: [],
    userstyleUrls: [],
    themes: []
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
              .then((text) => (styles.push(text)))
          );
        }
      }
    } else {
      for (const style of manifest.userstyles || []) {
        if (userscriptMatches({ url }, style, addonId)) data.userstyleUrls.push(chrome.runtime.getURL(`/addons/${addonId}/${style.url}`));
      }
    }
  }

  await Promise.all(fetchThemeStylesPromises);
  data.globalState = scratchAddons.globalState._target;

  return data;
}

chrome.webNavigation.onCommitted.addListener(async (request) => {
  const data = await getContentScriptInfo(request.url, request.tabId);
  let receivedResponse = false;
  chrome.tabs.sendMessage(request.tabId, { contentScriptInfo: data }, (res) => res && (receivedResponse = true));
  const interval = setInterval(
    () =>
      chrome.tabs.sendMessage(request.tabId, { contentScriptInfo: data }, (res) => res && clearInterval(interval)),
    200
  );
}, {
  url: [{ hostEquals: "scratch.mit.edu" }],
});
scratchAddons.localEvents.addEventListener("themesUpdated", () => {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", async (res) => {
          if (res) {
            chrome.tabs.sendMessage(tab.id, { themesUpdated: (await getContentScriptInfo(res, tab.id)).themes});
          }
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
