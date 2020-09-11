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
      if (scripts.length || styles.length)
      response.push({ addonId: addon.addonId, scripts, styles });
    }
    sendResponse(response);
  }
  else if (request === "getGlobalState") sendResponse(scratchAddons.globalState._target); // Firefox breaks if we send a proxy
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
  const patternURL = new URL(pattern);
  const urlURL = new URL(url);
  if (patternURL.origin !== urlURL.origin) return false;
  const patternPath = patternURL.pathname.split("/");
  const urlPath = urlURL.pathname.split("/");
  if (urlPath[urlPath.length - 1] !== "") urlPath.push("");
  while (patternPath.length) {
    const p = patternPath.shift();
    const q = urlPath.shift();
    if (p !== q && p !== "*") return false;
  }
  return true;
}
