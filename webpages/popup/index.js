//theme switching
const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", "light.css");
chrome.storage.sync.get(["globalTheme"], function (r) {
  let rr = false; //true = light, false = dark
  if (r.globalTheme) rr = r.globalTheme;
  if (rr) {
    document.head.appendChild(lightThemeLink);
  }
});

const vue = new Vue({
  el: "body",
  data: {
    popups: [],
    currentPopup: null,
  },
  computed: {
    version() {
      return chrome.runtime.getManifest().version;
    },
  },
  methods: {
    msg(message, ...params) {
      return chrome.i18n.getMessage(message, ...params);
    },
    closePopup() {
      setTimeout(() => window.close(), 100);
    },
    openSettingsPage() {
      chrome.runtime.openOptionsPage();
      closePopup();
    },
    openChangelog() {
      window.open("https://scratchaddons.com/changelog?versionname=" + chrome.runtime.getManifest().version_name);
      closePopup();
    },
    setPopup(popup) {
      if (vue.currentPopup !== popup) {
        vue.currentPopup = popup;
        document.getElementById("iframe").src = `../../popups/${popup.addonId}/popup.html`;
        if (document.querySelector(".popup-name.sel"))
          document.querySelector(".popup-name.sel").classList.remove("sel");
        document.querySelector(`.popup-name[data-id="${popup.addonId}"]`).classList.add("sel");
      }
    },
  },
});

chrome.runtime.sendMessage("getSettingsInfo", (res) => {
  let order = ["scratch-messaging", "cloud-games"];
  let keys = Object.keys(res.addonsEnabled).filter(
    (k) => res.addonsEnabled[k] && res.manifests.find((o) => o.addonId == k).manifest.popup
  );
  keys.forEach((addon, i) => {
    res.manifests.find((o) => o.addonId == addon).manifest.popup.addonId = addon;
    vue.popups.push(res.manifests.find((o) => o.addonId == addon).manifest.popup);
    vue.popups = vue.popups.sort((a, b) => order.indexOf(a.addonId) - order.indexOf(b.addonId));
  });
  setTimeout(() => vue.setPopup(vue.popups[0]), 0);
});

chrome.runtime.sendMessage("checkPermissions");
