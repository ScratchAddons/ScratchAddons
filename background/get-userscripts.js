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

scratchAddons.localEvents.addEventListener("addonDynamicEnable", ({ detail }) => {
  const { addonId, manifest } = detail;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, (res) => {
          if (res) {
            (async () => {
              const { userscripts, userstyles } = await getAddonData({ addonId, url: res, manifest });
              chrome.tabs.sendMessage(
                tab.id,
                {
                  dynamicAddonEnabled: {
                    scripts: userscripts,
                    userstyles,
                    addonId,
                    injectAsStyleElt: !!manifest.injectAsStyleElt,
                    index: scratchAddons.manifests.findIndex((addon) => addon.addonId === addonId),
                  },
                },
                { frameId: 0 }
              );
            })();
          }
        });
      }
    })
  );
});
scratchAddons.localEvents.addEventListener("addonDynamicDisable", ({ detail }) => {
  const { addonId } = detail;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, { dynamicAddonDisable: { addonId } }, { frameId: 0 });
      }
    })
  );
});
scratchAddons.localEvents.addEventListener("updateUserstylesSettingsChange", ({ detail }) => {
  const { addonId, manifest } = detail;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url || (!tab.url && typeof browser !== "undefined")) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, (res) => {
          if (res) {
            (async () => {
              const { userscripts, userstyles } = await getAddonData({ addonId, url: res, manifest });
              chrome.tabs.sendMessage(
                tab.id,
                {
                  updateUserstylesSettingsChange: {
                    scripts: userscripts,
                    userstyles,
                    addonId,
                    injectAsStyleElt: !!manifest.injectAsStyleElt,
                    index: scratchAddons.manifests.findIndex((addon) => addon.addonId === addonId),
                  },
                },
                { frameId: 0 }
              );
            })();
          }
        });
      }
    })
  );
});

async function getAddonData({ addonId, manifest, url }) {
  const promises = [];

  const userscripts = [];
  for (const script of manifest.userscripts || []) {
    if (userscriptMatches({ url }, script, addonId))
      userscripts.push({
        url: script.url,
        runAtComplete: typeof script.runAtComplete === "boolean" ? script.runAtComplete : true,
      });
  }
  const userstyles = [];
  for (const style of manifest.userstyles || []) {
    if (userscriptMatches({ url }, style, addonId))
      if (manifest.injectAsStyleElt) {
        // Reserve index in array to avoid race conditions (#700)
        const arrLength = userstyles.push(null);
        const indexToUse = arrLength - 1;
        promises.push(
          fetch(chrome.runtime.getURL(`/addons/${addonId}/${style.url}`))
            .then((res) => res.text())
            .then((text) => {
              // Replace %addon-self-dir% for relative URLs
              text = text.replace(/\%addon-self-dir\%/g, chrome.runtime.getURL(`addons/${addonId}`));
              // Provide source url
              text += `\n/*# sourceURL=${style.url} */`;
              userstyles[indexToUse] = text;
            })
        );
      } else {
        userstyles.push(chrome.runtime.getURL(`/addons/${addonId}/${style.url}`));
      }
  }
  await Promise.all(promises);

  return { userscripts, userstyles };
}

async function getContentScriptInfo(url) {
  const data = {
    url,
    l10njson: getL10NURLs(),
    globalState: {},
    addonsWithUserscripts: [],
    addonsWithUserstyles: [],
  };
  const promises = [];
  scratchAddons.manifests.forEach(async ({ addonId, manifest }, i) => {
    if (!scratchAddons.localState.addonsEnabled[addonId]) return;
    const promise = getAddonData({ addonId, manifest, url });
    promises.push(promise);
    const { userscripts, userstyles } = await promise;
    if (userscripts.length) data.addonsWithUserscripts.push({ addonId, scripts: userscripts });

    if (userstyles.length)
      data.addonsWithUserstyles.push({
        addonId,
        styles: userstyles,
        injectAsStyleElt: manifest.injectAsStyleElt,
        index: i,
      });
  });

  await Promise.all(promises);
  data.globalState = scratchAddons.globalState._target;

  return data;
}

function createCsIdentity({ tabId, frameId, url }) {
  // String that should uniquely identify a tab/iframe in the csInfoCache map
  return `${tabId}/${frameId}@${url}`;
}

const csInfoCache = new Map();

// Using this event to preload contentScriptInfo ASAP, since onBeforeRequest
// obviously happens before the content script has a chance to send us a message.
// However, SA should work just fine even if this event does not trigger
// (example: on browser startup, with a Scratch page opening on startup).
chrome.webRequest.onBeforeRequest.addListener(
  async (request) => {
    if (!scratchAddons.localState.allReady) return;
    const identity = createCsIdentity({ tabId: request.tabId, frameId: request.frameId, url: request.url });
    const loadingObj = { loading: true };
    csInfoCache.set(identity, loadingObj);
    const info = await getContentScriptInfo(request.url);
    if (csInfoCache.get(identity) !== loadingObj) {
      // Another content script with same identity took our
      // place in the csInfoCache map while the promise resolved
      return;
    }
    csInfoCache.set(identity, { loading: false, info, timestamp: Date.now() });
    scratchAddons.localEvents.dispatchEvent(new CustomEvent("csInfoCacheUpdated"));
  },
  {
    urls: ["https://scratch.mit.edu/*"],
    types: ["main_frame", "sub_frame"],
  }
);

// It is not uncommon to cache objects that will never be used
// Example: going to https://scratch.mit.edu/studios/104 (no slash after 104)
// will redirect to /studios/104/ (with a slash)
// If a cache entry is too old, remove it
chrome.alarms.create("cleanCsInfoCache", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanCsInfoCache") {
    csInfoCache.forEach((obj, key) => {
      if (!obj.loading) {
        const currentTimestamp = Date.now();
        const objTimestamp = obj.timestamp;
        if (currentTimestamp - objTimestamp > 45000) {
          csInfoCache.delete(key);
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.contentScriptReady) return;
  if (scratchAddons.localState.allReady) {
    const identity = createCsIdentity({
      tabId: sender.tab.id,
      frameId: sender.frameId,
      url: request.contentScriptReady.url,
    });
    const getCacheEntry = () => csInfoCache.get(identity);
    let cacheEntry = getCacheEntry();
    if (cacheEntry) {
      if (cacheEntry.loading) {
        scratchAddons.localEvents.addEventListener("csInfoCacheUpdated", function thisFunction() {
          cacheEntry = getCacheEntry();
          if (!cacheEntry.loading) {
            sendResponse(cacheEntry.info);
            csInfoCache.delete(identity);
            scratchAddons.localEvents.removeEventListener("csInfoCacheUpdated", thisFunction);
          }
        });
      } else {
        sendResponse(cacheEntry.info);
        csInfoCache.delete(identity);
      }
    } else {
      getContentScriptInfo(request.contentScriptReady.url).then((info) => {
        sendResponse(info);
      });
      return true;
    }
  } else {
    // Wait until manifests, addon.auth and addon.settings are ready
    scratchAddons.localEvents.addEventListener(
      "ready",
      async () => {
        const info = await getContentScriptInfo(request.contentScriptReady.url);
        sendResponse(info);
      },
      { once: true }
    );
    return true;
  }
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
