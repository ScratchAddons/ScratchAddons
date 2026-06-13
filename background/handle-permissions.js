import changeAddonState from "./imports/change-addon-state.js";
import { getMissingOptionalPermissions } from "./imports/util.js";

const logPermissionError = (granted) => {
  if (granted) return;
  console.error("Site access is not granted.");
};

const openPermissionSettings = (granted) => {
  if (granted) return;
  logPermissionError(granted);
  chrome.runtime.sendMessage("promptPermissions");
  chrome.runtime.openOptionsPage();
};

const checkSitePermissions = (callback) => {
  chrome.permissions.contains(
    {
      origins: chrome.runtime.getManifest().host_permissions.filter((url) => url.startsWith("https://")),
    },
    (hasPermissions) => {
      callback(hasPermissions);
    }
  );
};

const checkOptionalPermissions = () => {
  getMissingOptionalPermissions().then((missing) => {
    scratchAddons.manifests.forEach(({ addonId, manifest }) => {
      if (scratchAddons.localState.addonsEnabled[addonId] && manifest.permissions?.some((p) => missing.includes(p))) {
        console.warn("Disabled addon", addonId, "due to missing optional permission");
        changeAddonState(addonId, false);
      }
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request !== "checkPermissions") return;
  checkSitePermissions(sendResponse);
  return true;
});

chrome.permissions.onRemoved?.addListener(() => {
  checkSitePermissions(openPermissionSettings);
  checkOptionalPermissions();
});

checkSitePermissions(logPermissionError);
checkOptionalPermissions();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // If the user just installed the extension, we do not consider this startup,
    // it's fine to open a new tab if needed in this case.
    // This happens on Firefox when loading the extension as temporary.
    checkSitePermissions(openPermissionSettings);
  }
});
