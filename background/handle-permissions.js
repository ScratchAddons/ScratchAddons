import changeAddonState from "./imports/change-addon-state.js";
import { getMissingOptionalPermissions } from "./imports/util.js";

const onPermissionsRevoked = ({ ask }) => {
  console.error("Site access is not granted.");
  if (ask) {
    chrome.tabs.create({
      active: true,
      url: "/webpages/settings/index.html",
    });
  }
};

const checkSitePermissions = (sendResponse, { ask }) => {
  chrome.permissions.contains(
    {
      origins: chrome.runtime.getManifest().host_permissions.filter((url) => url.startsWith("https://")),
    },
    (hasPermissions) => {
      if (!hasPermissions) {
        onPermissionsRevoked({ ask });
      }
      sendResponse(hasPermissions);
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
  // When the popup checks for permissions, redirect to the settings page if they are missing.
  // When the settings page checks, just send a response; it does the asking.
  const isFromPopup = sender.url === chrome.runtime.getURL(chrome.runtime.getManifest().action.default_popup);
  checkSitePermissions(sendResponse, { ask: isFromPopup });
  return true;
});

chrome.permissions.onRemoved?.addListener(() => {
  checkSitePermissions(() => {}, { ask: true });
  checkOptionalPermissions();
});

checkSitePermissions(() => {}, { ask: false });
checkOptionalPermissions();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // If the user just installed the extension, we do not consider this startup,
    // it's fine to open a new tab if needed in this case.
    // This happens on Firefox when loading the extension as temporary.
    checkSitePermissions(() => {}, { ask: true });
  }
});
