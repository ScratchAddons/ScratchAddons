if (scratchAddons.localState.allReady) getUserscripts();
else scratchAddons.localEvents.addEventListener("ready", getUserscripts);

const addonsWithUserscripts = [];
async function getUserscripts() {
  for (const { manifest, addonId } of scratchAddons.manifests) {
    if (manifest.userscripts || manifest.userstyles) {
      addonsWithUserscripts.push({ addonId, scripts: manifest.userscripts || [], styles: manifest.userstyles || [] });
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.getUserscripts) {
    const response = [];
    for (const addon of addonsWithUserscripts) {
      if (!scratchAddons.localState.addonsEnabled[addon.addonId]) continue;
      const scripts = [];
      const styles = [];
      for (const script of addon.scripts) {
        if (userscriptMatches(request.getUserscripts, script, addon.addonId))
          scripts.push({
            url: script.url,
            runAtComplete: typeof script.runAtComplete === "boolean" ? script.runAtComplete : true,
          });
      }
      for (const style of addon.styles) {
        if (userscriptMatches(request.getUserscripts, style, addon.addonId)) styles.push(style.url);
      }
      if (scripts.length || styles.length) response.push({ addonId: addon.addonId, scripts, styles });
    }
    sendResponse(response);
  } else if (request === "getGlobalState") sendResponse(scratchAddons.globalState._target);
  // Firefox breaks if we send a proxy
  else if (request === "openSettingsOnThisTab")
    chrome.tabs.update(sender.tab.id, { url: chrome.runtime.getURL("webpages/settings/index.html") });
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
