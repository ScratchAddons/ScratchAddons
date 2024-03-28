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
      const now = Date.now() / 1000;
      if (message === "extensionName" && now < 1712059200 && now > 1711886400) {
        return window.matchMedia("(prefers-reduced-motion)").matches ? "Scratch Haddocks 🐟🐟" : "Scratch Haddocks";
      }
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
      const now = Date.now() / 1000;
      if (now < 1712059200 && now > 1711886400) return ver;
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

// April Fools 2024 below

class Haddock {
  constructor(elem) {
    this.elem = elem;
    const rect = elem.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.facingRight = parseInt(elem.style.left) > 200;
    (async () => {
      while (true) {
        this.facingRight = !this.facingRight;
        const duration = 6 + Math.random() * 5; // 6-11 secs
        this.cycle(duration);
        await new Promise((r) => setTimeout(r, duration * 1000));
      }
    })();
  }

  cycle(duration) {
    this.elem.style.transitionProperty = "transform, left, top";
    this.elem.style.transitionDuration = `0.2s, ${duration}s, ${duration}s`;
    setTimeout(() => {
      this.elem.style.transform = `scaleX(${this.facingRight ? -1 : 1})`;
      // If the haddock is facing left, move to anywhere on the left half of the screen.
      // If the haddock is facing right, move to anywhere on the right half of the screen.
      this.elem.style.left = (Math.random() + this.facingRight) * ((window.innerWidth - this.width) / 2) + "px";
      this.elem.style.top = Math.random() * (window.innerHeight - this.height) + "px";
    }, 0);
  }
}

function spawnFish(initX, initY) {
  const fishElem = document.createElement("span");
  fishElem.textContent = "🐟";
  fishElem.style.pointerEvents = "none";
  fishElem.style.position = "absolute";
  fishElem.style.left = initX + "px";
  fishElem.style.top = initY + "px";
  fishElem.style.fontSize = "22px";
  fishElem.style.textShadow = "#000 0px 2px 5px";
  new Haddock(document.body.appendChild(fishElem));
}

const now = Date.now() / 1000;
if (now < 1712059200 && now > 1711886400) {
  if (window.matchMedia("(prefers-reduced-motion)").matches) {
    document.getElementById("title-text").style.fontSize = "14px"; // To fit the fish emojis
  } else {
    setTimeout(() => {
      spawnFish(20, 40);
      spawnFish(340, 270);
      spawnFish(50, 520);
    }, 100);
  }
}
