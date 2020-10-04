import runPersistentScripts from "./imports/run-persistent-scripts.js";

function setLocalStorage(arr) {
  const iframe = document.createElement("iframe");
  iframe.src = "https://scratch.mit.edu/projects/0111001101100001/embed";
  document.body.appendChild(iframe);
  window.addEventListener("message", (event) => {
    if (event.origin === "https://scratch.mit.edu" && event.data === "ready") {
      iframe.contentWindow.postMessage(arr, "*");
      window.addEventListener("message", (event) => {
        if (event.origin === "https://scratch.mit.edu" && event.data === "OK") {
          iframe.remove();
        }
      }, {once: true});
    }
  }, {once: true});
}

function setTrapsLocalStorageValue() {
  const enabled = scratchAddons.manifests.filter((obj) => scratchAddons.localState.addonsEnabled[obj.addonId]).some((obj) => obj.manifest.traps);
  setLocalStorage([{key: "sa-trapsEnabled", value: enabled}]);
}

if (scratchAddons.localState.allReady) setTrapsLocalStorageValue();
else scratchAddons.localEvents.addEventListener("ready", setTrapsLocalStorageValue);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getSettingsInfo") {
    sendResponse({
      manifests: scratchAddons.manifests,
      // Firefox breaks if we send proxies
      addonsEnabled: scratchAddons.localState._target.addonsEnabled,
      addonSettings: scratchAddons.globalState._target.addonSettings,
    });
  } else if (request.changeEnabledState) {
    const { addonId, newState } = request.changeEnabledState;
    scratchAddons.localState.addonsEnabled[addonId] = newState;
    chrome.storage.sync.set({
      addonsEnabled: scratchAddons.localState.addonsEnabled,
    });
    if (newState === false) {
      const addonObjs = scratchAddons.addonObjects.filter((addonObj) => addonObj.self.id === addonId);
      if (addonObjs) addonObjs.forEach((addonObj) => addonObj._kill());
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
    } else {
      runPersistentScripts(addonId);
    }

    if (scratchAddons.manifests.find((obj) => obj.addonId === addonId).manifest.tags.includes("theme"))
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("themesUpdated"));
    setTrapsLocalStorageValue();
  } else if (request.changeAddonSettings) {
    const { addonId, newSettings } = request.changeAddonSettings;
    scratchAddons.globalState.addonSettings[addonId] = newSettings;
    chrome.storage.sync.set({
      addonSettings: scratchAddons.globalState.addonSettings,
    });

    if (scratchAddons.manifests.find((obj) => obj.addonId === addonId).manifest.tags.includes("theme"))
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("themesUpdated"));
  }
});
