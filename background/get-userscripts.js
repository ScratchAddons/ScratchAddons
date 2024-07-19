import changeAddonState from "./imports/change-addon-state.js";
import { getMissingOptionalPermissions } from "./imports/util.js";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.replaceTabWithUrl) chrome.tabs.update(sender.tab.id, { url: request.replaceTabWithUrl });
  else if (request.getEnabledAddons) {
    let enabled = Object.keys(scratchAddons.localState.addonsEnabled).filter(
      (addonId) => scratchAddons.localState.addonsEnabled[addonId]
    );
    const tag = request.getEnabledAddons.tag;
    if (tag) {
      enabled = enabled.filter((id) =>
        scratchAddons.manifests.some(({ addonId, manifest }) => addonId === id && manifest.tags.includes(tag))
      );
    }
    sendResponse(enabled);
  }
});

scratchAddons.localEvents.addEventListener("addonDynamicEnable", ({ detail }) => {
  const { addonId, manifest, partialDynamicEnableBy } = detail;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, (res) => {
          void chrome.runtime.lastError;
          if (res) {
            (async () => {
              const { userscripts, userstyles, cssVariables } = await getAddonData({ addonId, url: res, manifest });
              // Handle partial dynamic enable (PDE)
              // Userscripts currently cannot be PDEd
              // Note: this can still result in userstyles being empty
              // if a userstyle depends on multiple addons
              // If no running userstyles depend on the provided dependency,
              // this means no new userstyles are loaded, thus early return.
              // We still need to send the whole array.
              if (partialDynamicEnableBy) {
                // NOR(a userstyle has a dependency on the newly enabled addon), RETURN
                if (!userstyles.some((style) => style.addonEnabled?.includes(partialDynamicEnableBy))) return;
              }
              if (userscripts.length || userstyles.length) {
                chrome.tabs.sendMessage(
                  tab.id,
                  {
                    dynamicAddonEnabled: {
                      scripts: userscripts,
                      userstyles,
                      cssVariables,
                      addonId,
                      injectAsStyleElt: !!manifest.injectAsStyleElt,
                      index: scratchAddons.manifests.findIndex((addon) => addon.addonId === addonId),
                      dynamicEnable: Boolean(manifest.dynamicEnable),
                      dynamicDisable: Boolean(manifest.dynamicDisable),
                      partial: !!partialDynamicEnableBy,
                    },
                  },
                  { frameId: 0 }
                );
              }
            })();
          }
        });
      }
    })
  );
});
scratchAddons.localEvents.addEventListener("addonDynamicDisable", ({ detail }) => {
  const { addonId, manifest, partialDynamicDisableBy } = detail;
  let partialDynamicDisabledStyles;
  if (partialDynamicDisableBy) {
    partialDynamicDisabledStyles = manifest.userstyles
      ?.filter((injectable) => injectable.if?.addonEnabled?.includes(partialDynamicDisableBy))
      .map((style) => chrome.runtime.getURL(`/addons/${addonId}/${style.url}`));
  }
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            dynamicAddonDisable: {
              addonId,
              partialDynamicDisabledStyles,
            },
          },
          { frameId: 0 },
          () => void chrome.runtime.lastError
        );
      }
    })
  );
});
scratchAddons.localEvents.addEventListener("updateUserstylesSettingsChange", ({ detail }) => {
  const { addonId, manifest, newSettings } = detail;
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => {
      if (tab.url) {
        chrome.tabs.sendMessage(tab.id, "getInitialUrl", { frameId: 0 }, (res) => {
          if (res) {
            (async () => {
              const { userscripts, userstyles, cssVariables } = await getAddonData({ addonId, url: res, manifest });
              chrome.tabs.sendMessage(
                tab.id,
                {
                  updateUserstylesSettingsChange: {
                    scripts: userscripts,
                    userstyles,
                    cssVariables,
                    addonId,
                    addonSettings: newSettings,
                    injectAsStyleElt: !!manifest.injectAsStyleElt,
                    index: scratchAddons.manifests.findIndex((addon) => addon.addonId === addonId),
                    dynamicEnable: manifest.dynamicEnable,
                    dynamicDisable: manifest.dynamicDisable,
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
  for (let i = 0; i < manifest.userstyles?.length; i++) {
    const style = manifest.userstyles[i];
    const styleHref = chrome.runtime.getURL(`/addons/${addonId}/${style.url}`);
    if (userscriptMatches({ url }, style, addonId))
      if (manifest.injectAsStyleElt) {
        // Reserve index in array to avoid race conditions (#700)
        const arrLength = userstyles.push(null);
        const indexToUse = arrLength - 1;
        promises.push(
          fetch(styleHref)
            .then((res) => res.text())
            .then((text) => {
              // Replace %addon-self-dir% for relative URLs
              text = text.replace(/\%addon-self-dir\%/g, chrome.runtime.getURL(`addons/${addonId}`));
              // Provide source url
              text += `\n/*# sourceURL=${style.url} */`;
              userstyles[indexToUse] = {
                href: styleHref,
                text,
                index: i,
                addonEnabled: style.if?.addonEnabled,
              };
            })
        );
      } else {
        userstyles.push({
          href: styleHref,
          index: i,
          addonEnabled: style.if?.addonEnabled,
        });
      }
  }
  await Promise.all(promises);

  return { userscripts, userstyles, cssVariables: manifest.customCssVariables || [] };
}

async function getContentScriptInfo(url) {
  const data = {
    url,
    httpStatusCode: null, // Set by webRequest onResponseStarted listener
    globalState: {},
    addonsWithUserscripts: [],
    addonsWithUserstyles: [],
  };
  const promises = [];
  const missingPermissions = await getMissingOptionalPermissions();
  scratchAddons.manifests.forEach(async ({ addonId, manifest }, i) => {
    if (!scratchAddons.localState.addonsEnabled[addonId]) return;
    if (manifest.permissions?.some((p) => missingPermissions.includes(p))) {
      changeAddonState(addonId, false);
      return;
    }
    const promise = getAddonData({ addonId, manifest, url });
    promises.push(promise);
    const { userscripts, userstyles, cssVariables } = await promise;
    if (userscripts.length) data.addonsWithUserscripts.push({ addonId, scripts: userscripts });

    if (userstyles.length)
      data.addonsWithUserstyles.push({
        addonId,
        styles: userstyles,
        cssVariables,
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
const alarmFrequency =
  typeof browser !== "undefined"
    ? // ↓ Firefox (event page)
      1
    : // ↓ Chromium (service worker)
      5;
chrome.alarms.create("cleanCsInfoCache", { periodInMinutes: alarmFrequency });
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

chrome.webRequest.onResponseStarted.addListener(
  (request) => {
    const identity = createCsIdentity({ tabId: request.tabId, frameId: request.frameId, url: request.url });
    const cacheEntry = csInfoCache.get(identity);
    if (cacheEntry && cacheEntry.loading === false) {
      cacheEntry.info.httpStatusCode = request.statusCode;
    }
  },
  {
    urls: ["https://scratch.mit.edu/*"],
    types: ["main_frame"],
  }
);

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
          if (!cacheEntry) {
            scratchAddons.localEvents.removeEventListener("csInfoCacheUpdated", thisFunction);
          } else if (!cacheEntry.loading) {
            sendResponse(cacheEntry.info);
            csInfoCache.delete(identity);
            scratchAddons.localEvents.removeEventListener("csInfoCacheUpdated", thisFunction);
          }
        });
        return true;
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
    // Wait until manifests and addon.settings are ready
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
// In case a tab messaged us before we registered the event above,
// we notify them they can resend the contentScriptInfo message
chrome.tabs.query({}, (tabs) =>
  tabs.forEach((tab) => {
    if (tab.url) {
      chrome.tabs.sendMessage(tab.id, "backgroundListenerReady", () => void chrome.runtime.lastError);
    }
  })
);

// Pathname patterns. Make sure NOT to set global flag!
// Don't forget ^ and $
const WELL_KNOWN_PATTERNS = {
  projects: /^\/projects\/(?:editor|\d+(?:\/(?:fullscreen|editor))?)\/?$/,
  projectEmbeds: /^\/projects\/\d+\/embed\/?$/,
  studios: /^\/studios\/\d+(?:\/(?:projects|comments|curators|activity))?\/?$/,
  profiles: /^\/users\/[\w-]+\/?$/,
  topics: /^\/discuss\/topic\/\d+\/?$/,
  newPostScreens: /^\/discuss\/(?:topic\/\d+|\d+\/topic\/add)\/?$/,
  editingScreens: /^\/discuss\/(?:topic\/\d+|\d+\/topic\/add|post\/\d+\/edit|settings\/[\w-]+)\/?$/,
  forums: /^\/discuss(?!\/m(?:$|\/))(?:\/.*)?$/,
  // scratch-www routes, not including project pages
  // Matches /projects (an error page) but not /projects/<id>
  scratchWWWNoProject:
    /^\/(?:(?:about|annual-report(?:\/\d+)?|camp|conference\/20(?:1[79]|[2-9]\d|18(?:\/(?:[^\/]+\/details|expect|plan|schedule))?)|contact-us|code-of-ethics|credits|developers|DMCA|download(?:\/(?:scratch2|scratch-link))?|educators(?:\/(?:faq|register|waiting))?|explore\/(?:project|studio)s\/\w+(?:\/\w+)?|community_guidelines|faq|ideas|join|messages|parents|privacy_policy(?:\/apps)?|research|scratch_1\.4|search\/(?:project|studio)s|starter-projects|classes\/(?:complete_registration|[^\/]+\/register\/[^\/]+)|signup\/[^\/]+|terms_of_use|wedo(?:-legacy)?|ev3|microbit|vernier|boost|studios\/\d*(?:\/(?:projects|comments|curators|activity))?|components|become-a-scratcher|projects|cookies|accounts\/bad-username)\/?)?$/,
};

const WELL_KNOWN_MATCHERS = {
  isNotScratchWWW: (match) => {
    const { projects, projectEmbeds, scratchWWWNoProject } = WELL_KNOWN_PATTERNS;
    // Server errors and emails are neither r2 nor www
    return !(
      projects.test(match) ||
      projectEmbeds.test(match) ||
      scratchWWWNoProject.test(match) ||
      /^\/(?:50[03]\/?$|cdn\/|emails\/)/.test(match)
    );
  },
};

function matchesIf(injectable, settings) {
  // injectable.if is guaranteed to exist
  // addonEnabled and settings are AND-ed
  // settings keys are AND-ed
  // addonEnabled and settings values are OR-ed

  /**
   * Formula:
   * NOT (
   *  (addonEnabled exists AND all of the addons are disabled) OR
   *  (settings exists AND there is a setting where none of potential values match)
   * )
   * Or,
   * NOT (
   *  (addonEnabled AND AND(addons**Dis**abled)) OR
   *  (settings exists AND OR(AND(settings do **NOT** match)))
   * )
   */

  return !(
    (injectable.if.addonEnabled?.length &&
      (Array.isArray(injectable.if.addonEnabled) ? injectable.if.addonEnabled : [injectable.if.addonEnabled]).every(
        (addon) => !scratchAddons.localState.addonsEnabled[addon]
      )) ||
    (injectable.if.settings &&
      Object.keys(injectable.if.settings).some((settingName) =>
        (Array.isArray(injectable.if.settings[settingName])
          ? injectable.if.settings[settingName]
          : [injectable.if.settings[settingName]]
        ).every((possibleValue) => settings[settingName] !== possibleValue)
      ))
  );
}

// regexPattern = "^https:(absolute-regex)" | "^(relative-regex)"
// matchesPattern = "*" | regexPattern | Array<wellKnownName | wellKnownMatcher | regexPattern | legacyPattern>
function userscriptMatches(data, scriptOrStyle, addonId) {
  if (scriptOrStyle.if && !matchesIf(scriptOrStyle, scratchAddons.globalState.addonSettings[addonId])) return false;

  let _url = data.url;
  let _parsedURL = new URL(_url);
  if (_parsedURL.origin === "https://scratchfoundation.github.io" || _parsedURL.port === "8601") {
    // Run addons on scratch-gui
    _url = "https://scratch.mit.edu/projects/editor/";
    _parsedURL = new URL(_url);
  }
  const url = _url;
  const parsedURL = _parsedURL;
  const { matches, _scratchDomainImplied } = scriptOrStyle;
  const parsedPathname = parsedURL.pathname;
  const parsedOrigin = parsedURL.origin;
  const originPath = parsedOrigin + parsedPathname;
  const matchURL = _scratchDomainImplied ? parsedPathname : originPath;
  const scratchOrigin = parsedURL.port === "8333" ? "http://localhost:8333" : "https://scratch.mit.edu";
  const isScratchOrigin = parsedOrigin === scratchOrigin;
  // "*" is used for any URL on Scratch origin
  if (matches === "*") return isScratchOrigin;
  // matches becomes RegExp if it is a string that starts with ^
  // See load-addon-manifests.js
  if (matches instanceof RegExp) {
    if (_scratchDomainImplied && !isScratchOrigin) return false;
    return matches.test(matchURL);
  }
  for (const match of matches) {
    if (match instanceof RegExp) {
      if (match._scratchDomainImplied && !isScratchOrigin) continue;
      if (match.test(match._scratchDomainImplied ? parsedPathname : originPath)) {
        return true;
      }
    } else if (Object.prototype.hasOwnProperty.call(WELL_KNOWN_PATTERNS, match)) {
      if (isScratchOrigin && WELL_KNOWN_PATTERNS[match].test(parsedPathname)) return true;
    } else if (Object.prototype.hasOwnProperty.call(WELL_KNOWN_MATCHERS, match)) {
      if (isScratchOrigin && WELL_KNOWN_MATCHERS[match](parsedPathname)) return true;
    } else if (urlMatchesLegacyPattern(match, parsedURL)) return true;
  }
  return false;
}

function urlMatchesLegacyPattern(pattern, urlUrl) {
  const patternUrl = new URL(pattern);
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
