import wildcard from "./wildcard.js";
if (scratchAddons.localState.allReady) getUsercripts();
else window.addEventListener("scratchaddonsready", getUsercripts);

const addonsWithUserscripts = [];
async function getUsercripts() {
  for (const addonId in scratchAddons.manifests) {
    const manifest = scratchAddons.manifests[addonId];
    if (manifest.userscripts) {
      addonsWithUserscripts.push({ addonId, scripts: manifest.userscripts });
    }
  }
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.getUserscripts) {
    const addons = [];
    for (const addon of addonsWithUserscripts) {
      const scriptsToRun = [];
      for (const script of addon.scripts) {
        if (userscriptMatches(request.getUserscripts, script.matches))
          scriptsToRun.push(script.url);
      }
      if (scriptsToRun.length)
        addons.push({ addonId: addon.addonId, scripts: scriptsToRun });
    }
    sendResponse(addons);
  }
});

function userscriptMatches(data, matches) {
  const url = data.url;
  for (const match of matches) {
    if (urlMatchesPattern(match, url)) return true;
  }
  return false;
}

function urlMatchesPattern(_pattern, _url) {
  _url = ((_pattern.endsWith("/")) && (!_url.endsWith("/"))) ? `${_url}/` : _url;
  _url = _url.split("#")[0].split("?")[0];
  return !!(wildcard(_pattern,_url));
}