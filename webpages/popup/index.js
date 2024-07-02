import globalTheme from "../../libraries/common/global-theme.js";

globalTheme();

function calculatePopupSize() {
  if (!window.innerWidth || !window.innerHeight) {
    setTimeout(calculatePopupSize, 0);
    return;
  }
  let width = window.innerWidth;
  document.documentElement.style.setProperty("--width", `${width}px`);
  let height = window.innerHeight - 3;
  document.documentElement.style.setProperty("--height", `${height}px`);
  document.body.classList.remove("loading");
}

window.addEventListener("load", () => setTimeout(calculatePopupSize, 0));

const vue = new Vue({
  el: "body",
  data: {
    popups: [],
    currentPopup: null,
    popupsWithIframes: [],
  },
  methods: {
    msg(message, ...params) {
      return chrome.i18n.getMessage(message, ...params);
    },
    direction() {
      return chrome.i18n.getMessage("@@bidi_dir");
    },
    closePopup() {
      setTimeout(() => window.close(), 100);
    },
    openSettingsPage() {
      chrome.runtime.openOptionsPage();
      this.closePopup();
    },
    setPopup(popup) {
      if (this.currentPopup !== popup) {
        this.currentPopup = popup;
        chrome.storage.local.set({
          lastSelectedPopup: popup._addonId,
        });
        if (!this.popupsWithIframes.includes(popup)) this.popupsWithIframes.push(popup);
        setTimeout(() => document.querySelector("iframe:not([style='display: none;'])").focus(), 0);
      }
    },
    iframeSrc(addonId) {
      return vue.popups.find((addon) => addon._addonId === addonId).html;
    },
  },
  computed: {
    changelogLink() {
      const uiLanguage = chrome.i18n.getUILanguage();
      const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
      const utm = `utm_source=extension&utm_medium=popup&utm_campaign=v${chrome.runtime.getManifest().version}`;
      return `https://scratchaddons.com/${localeSlash}changelog/?${utm}#v${chrome.runtime.getManifest().version}`;
    },
    version() {
      const prerelease = chrome.runtime.getManifest().version_name.includes("-prerelease");
      const ver = chrome.runtime.getManifest().version;
      return prerelease ? ver + "-pre" : ver;
    },
  },
});

let manifests = null;
// If order unspecified, addon goes first. All new popups should be added here.
const TAB_ORDER = ["scratch-messaging", "cloud-games", "__settings__"];

chrome.runtime.sendMessage("getSettingsInfo", (res) => {
  manifests = res.manifests;
  const popupObjects = Object.keys(res.addonsEnabled)
    .filter((addonId) => res.addonsEnabled[addonId] === true)
    .map((addonId) => manifests.find((addon) => addon.addonId === addonId))
    // Note an enabled addon might not exist anymore!
    .filter((findManifest) => findManifest !== undefined)
    .filter(({ manifest }) => manifest.popup)
    .sort(({ addonId: addonIdB }, { addonId: addonIdA }) => TAB_ORDER.indexOf(addonIdB) - TAB_ORDER.indexOf(addonIdA))
    .map(
      ({ addonId, manifest }) =>
        (manifest.popup._addonId = addonId) &&
        Object.assign(manifest.popup, {
          html: `../../popups/${addonId}/${manifest.popup.html}`,
        })
    );
  popupObjects.push({
    name: chrome.i18n.getMessage("quickSettings"),
    icon: "../../images/icons/wrench.svg",
    html: "../settings/index.html",
    _addonId: "__settings__",
  });
  vue.popups = popupObjects;
  chrome.storage.local.get("lastSelectedPopup", ({ lastSelectedPopup }) => {
    let id = -1;
    if (typeof lastSelectedPopup === "string") {
      id = vue.popups.findIndex((popup) => popup._addonId === lastSelectedPopup);
    }
    if (id !== -1) vue.setPopup(vue.popups[id]);
    else vue.setPopup(vue.popups.find((p) => p._addonId === "__settings__"));
  });
});

// Dynamic Popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.changeEnabledState) {
    const { addonId, newState } = request.changeEnabledState;
    const { manifest } = manifests.find((addon) => addon.addonId === addonId);
    if (!manifest.popup) return;
    if (newState === true) {
      manifest.popup._addonId = addonId;
      Object.assign(manifest.popup, {
        html: `../../popups/${addonId}/${manifest.popup.html}`,
      });

      vue.popups.push(manifest.popup);
      vue.popups = vue.popups.sort(
        ({ _addonId: addonIdB }, { _addonId: addonIdA }) => TAB_ORDER.indexOf(addonIdB) - TAB_ORDER.indexOf(addonIdA)
      );
    } else {
      let removeIndex = vue.popupsWithIframes.findIndex((popup) => popup._addonId === addonId);
      if (removeIndex !== -1) vue.popupsWithIframes.splice(removeIndex, 1);
      removeIndex = vue.popups.findIndex((popup) => popup._addonId === addonId);
      vue.popups.splice(removeIndex, 1);
      if (!vue.popups.includes(vue.currentPopup)) {
        vue.setPopup(vue.popups[0]); // set to default popup if current popup is no longer available
      }
    }
  }
});

chrome.runtime.sendMessage("checkPermissions");
