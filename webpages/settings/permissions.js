import globalTheme from "../../libraries/common/global-theme.js";

const vue = new Vue({
  el: "body",
  data: {
    screenshotPath: "../../images/screenshots/permissions-dark.png",
  },
  methods: {
    msg(message, ...param) {
      return chrome.i18n.getMessage(message, ...param);
    },
  },
});

globalTheme().then(({ theme }) => {
  if (theme) {
    vue.screenshotPath = "../../images/screenshots/permissions-light.png";
  }
});

document.title = chrome.i18n.getMessage("permissionsTitle");

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const MANIFEST_VERSION = 2;

document.getElementById("permissionsBtn").addEventListener("click", async () => {
  const HOST_PERMISSIONS_KEY_NAME = MANIFEST_VERSION === 2 ? "permissions" : "host_permissions";

  const manifest = chrome.runtime.getManifest();
  const origins = manifest[HOST_PERMISSIONS_KEY_NAME].filter((url) => url.startsWith("https://"));

  const granted = await promisify(chrome.permissions.request)({ origins });
  if (granted) {
    return chrome.runtime.reload();
  }
  alert(chrome.i18n.getMessage("permissionsDenied"));
});
