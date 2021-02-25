const onPermissionsRevoked = () => {
  console.error("Site access is not granted.");
  chrome.tabs.create({
    active: true,
    url: "/webpages/settings/permissions.html",
  });
};

const checkPermissions = (sendResponse) => {
  chrome.permissions.contains(
    {
      origins: chrome.runtime.getManifest().permissions.filter((url) => url.startsWith("https://")),
    },
    (hasPermissions) => {
      if (!hasPermissions) {
        onPermissionsRevoked();
      }
      sendResponse(hasPermissions);
    }
  );
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request !== "checkPermissions") return;
  checkPermissions(sendResponse);
  return true;
});

chrome.permissions.onRemoved.addListener(() => checkPermissions(() => {}));

checkPermissions(() => {});
