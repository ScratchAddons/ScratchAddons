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

window.addEventListener("load", () => {
  setTimeout(() => {
    let height = window.innerHeight - 3;
    document.documentElement.style.setProperty("--height", `${height}px`);
  }, 0);
});

const vue = new Vue({
  el: "body",
  data: {
    popups: [],
    currentPopup: null,
    popupsWithIframes: [],
    version: chrome.runtime.getManifest().version,
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
      this.closePopup();
    },
    openChangelog() {
      window.open("https://scratchaddons.com/changelog?versionname=" + chrome.runtime.getManifest().version_name);
      this.closePopup();
    },
    setPopup(popup) {
      if (this.currentPopup !== popup) {
        this.currentPopup = popup;
        if (!this.popupsWithIframes.includes(popup)) this.popupsWithIframes.push(popup);
        setTimeout(() => document.querySelector("iframe:not([style='display: none;'])").focus(), 0);
      }
    },
    iframeSrc(addonId) {
      return vue.popups.find((addon) => addon._addonId === addonId).url || `../../popups/${addonId}/popup.html`;
    },
  },
});

chrome.runtime.sendMessage("getSettingsInfo", (res) => {
  // If order unspecified, addon goes first. All new popups should be added here.
  const TAB_ORDER = ["scratch-messaging", "cloud-games"];
  const popupObjects = Object.keys(res.addonsEnabled)
    .filter((addonId) => res.addonsEnabled[addonId] === true)
    .map((addonId) => res.manifests.find((addon) => addon.addonId === addonId))
    // Note an enabled addon might not exist anymore!
    .filter((findManifest) => findManifest !== undefined)
    .filter(({ manifest }) => manifest.popup)
    .sort(({ addonId: addonIdB }, { addonId: addonIdA }) => TAB_ORDER.indexOf(addonIdB) - TAB_ORDER.indexOf(addonIdA))
    .map(({ addonId, manifest }) => (manifest.popup._addonId = addonId) && manifest.popup);
  popupObjects.push({
    name: chrome.i18n.getMessage("quickSettings"),
    icon: "../../images/icons/wrench.svg",
    url: "../../webpages/settings/index.html",
    _addonId: "__settings__",
  });
  vue.popups = popupObjects;
  vue.setPopup(vue.popups[0]);
});

chrome.runtime.sendMessage("checkPermissions");
