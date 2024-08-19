import globalTheme from "../../libraries/common/global-theme.js";
import { getMessage, reload, requestHostPermissions } from "../../libraries/common/settings-page-apis.js";

const vue = new Vue({
  el: "body",
  data: {
    screenshotPath: "../../images/screenshots/permissions-dark.png",
  },
  methods: {
    msg(message, ...param) {
      return getMessage(message, ...param);
    },
  },
});

globalTheme().then(({ theme }) => {
  if (theme) {
    vue.screenshotPath = "../../images/screenshots/permissions-light.png";
  }
});

document.title = getMessage("permissionsTitle");

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

document.getElementById("permissionsBtn").addEventListener("click", async () => {
  const granted = await requestHostPermissions()
  if (granted) {
    return reload();
  }
  alert(getMessage("permissionsDenied"));
});
