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
  const HOST_PERMISSIONS_KEY_NAME = globalThis.MANIFEST_VERSION === 2 ? "permissions" : "host_permissions";

  chrome.permissions.contains(
    {
      origins: chrome.runtime.getManifest()[HOST_PERMISSIONS_KEY_NAME].filter((url) => url.startsWith("https://")),
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
