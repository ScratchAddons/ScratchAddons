const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", "light.css");

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

chrome.storage.sync.get(["globalTheme"], function (r) {
  let rr = false; //true = light, false = dark
  if (r.globalTheme) rr = r.globalTheme;
  if (rr) {
    document.head.appendChild(lightThemeLink);
    vue.theme = "../../images/screenshots/permissions-light.png";
  }
});

document.title = chrome.i18n.getMessage("permissionsTitle");

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

document.getElementById("permissionsBtn").addEventListener("click", async () => {
  const manifest = chrome.runtime.getManifest();
  const origins = manifest.permissions.filter((url) => url.startsWith("https://"));

  const isAlreadyGranted = await promisify(chrome.permissions.contains)({ origins });
  if (isAlreadyGranted) {
    return window.close();
  }

  const granted = await promisify(chrome.permissions.request)({ origins });
  if (granted) {
    return chrome.runtime.reload();
  }
  alert(chrome.i18n.getMessage("permissionsDenied"));
});
