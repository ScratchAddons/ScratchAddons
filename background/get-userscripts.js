const o = chrome.tabs.sendMessage; // TODO: remove
chrome.tabs.sendMessage = function () {
  console.trace();
  return o.apply(chrome.tabs, arguments);
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    addonsWithUserscripts: [],
    addonsWithUserstyles: [],
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

function createCsIdentity({ tabId, frameId, url }) {
  // String that should uniquely identify a tab/iframe in the csInfoCache map
  return `${tabId}/${frameId}@${url}`;
}

const csInfoCache = new Map();

chrome.webRequest.onBeforeRequest.addListener(
  async (request) => {
    const identity = createCsIdentity({ tabId: request.tabId, frameId: request.frameId, url: request.url });
    // TODO: what if identity is taken?
    csInfoCache.set(identity, null);

    csInfoCache.set(identity, await getContentScriptInfo(request.url));
    console.log(csInfoCache, identity);

    // TODO: remove from cache
  },
  {
    urls: ["https://scratch.mit.edu/*"],
    types: ["main_frame", "sub_frame"],
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.contentScriptReady) return;
  // TODO: what if it's not in the cache already? test on startup. localState ready might even be false
  console.log("contentScriptReady");
  const identity = createCsIdentity({
    tabId: sender.tab.id,
    frameId: sender.frameId,
    url: request.contentScriptReady.url,
  });
  const info = csInfoCache.get(identity);
  sendResponse(info);
  csInfoCache.delete(identity);
});

scratchAddons.localEvents.addEventListener("themesUpdated", () => {
  // Only non-frames are updated
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, async (res) => {
          if (res) {
            chrome.tabs.sendMessage(
              tab.id,
              { themesUpdated: (await getContentScriptInfo(res)).themes },
              { frameId: 0 }
            );
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
