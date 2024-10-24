import changeAddonState from "./imports/change-addon-state.js";
import { getMissingOptionalPermissions } from "./imports/util.js";

const onPermissionsRevoked = ({ isStartup }) => {
  console.error("Site access is not granted.");
  if (!isStartup) {
    chrome.tabs.create({
      active: true,
      url: "/webpages/settings/permissions.html",
    });
  }
};

const checkSitePermissions = (sendResponse, { isStartup }) => {
  chrome.permissions.contains(
    {
      origins: chrome.runtime.getManifest().host_permissions.filter((url) => url.startsWith("https://")),
    },
    (hasPermissions) => {
      if (!hasPermissions) {
        onPermissionsRevoked({ isStartup });
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
  checkSitePermissions(sendResponse, { isStartup: false });
  return true;
});

chrome.permissions.onRemoved?.addListener(() => {
  checkSitePermissions(() => {}, { isStartup: false });
  checkOptionalPermissions();
});

checkSitePermissions(() => {}, { isStartup: true });
checkOptionalPermissions();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // If the user just installed the extension, we do not consider this startup,
    // it's fine to open a new tab if needed in this case.
    // This happens on Firefox when loading the extension as temporary.
    checkSitePermissions(() => {}, { isStartup: false });
  }
});
