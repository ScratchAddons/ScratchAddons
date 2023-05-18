<template>
  <div id="header">
    <div id="title">
      <img src="../../images/icon-transparent.svg" id="logo" alt="Logo" />
      <span id="title-text" v-cloak>
        {{ msg("extensionName") }}
        <a id="version" :href="changelogLink" target="_blank" title="{{ msg('changelog') }}">v{{ version }}</a>
      </span>
    </div>
    <div id="settings" @click="openSettingsPage()">
      <img src="../../images/icons/settings.svg" id="settings-icon" title="{{ msg('settings') }}" />
    </div>
  </div>
  <div id="popups">
    <div id="popup-bar" v-cloak>
      <div id="popup-chooser">
        <div
          v-for="popup of popups"
          class="popup-name"
          :class="{ sel: currentPopup === popup }"
          @click="setPopup(popup)"
        >
          <img v-if="popup.icon" :src="popup.icon" class="popup-icon" />
          <a class="popup-title">{{ popup.name }}</a>
          <a
            v-if="popup.fullscreen"
            class="popout"
            href="../../../popups/{{ popup._addonId }}/popup.html"
            target="_blank"
            @click="closePopup()"
          >
            <img src="../../images/icons/popout.svg" class="popout-img" title="{{ msg('openInNewTab') }}" />
          </a>
        </div>
      </div>
    </div>
    <iframe
      v-cloak
      v-for="popup in popupsWithIframes"
      v-show="currentPopup === popup"
      :src="iframeSrc(popup._addonId)"
      :key="popup._addonId"
    ></iframe>
  </div>
</template>
<script>
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

export default {
  data() {
    return {
      popups: [],
      currentPopup: null,
      popupsWithIframes: [],
    };
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
      return this.popups.find((addon) => addon._addonId === addonId).html;
    },
  },
  mounted() {
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
        .sort(
          ({ addonId: addonIdB }, { addonId: addonIdA }) => TAB_ORDER.indexOf(addonIdB) - TAB_ORDER.indexOf(addonIdA)
        )
        .map(
          ({ addonId, manifest }) =>
            (manifest.popup._addonId = addonId) &&
            Object.assign(manifest.popup, {
              html: `../../../popups/${addonId}/${manifest.popup.html}`,
            })
        );
      popupObjects.push({
        name: chrome.i18n.getMessage("quickSettings"),
        icon: "../../images/icons/wrench.svg",
        html: "../../webpages/dist/index.html",
        _addonId: "__settings__",
      });
      this.popups = popupObjects;
      chrome.storage.local.get("lastSelectedPopup", ({ lastSelectedPopup }) => {
        let id = 0;
        if (typeof lastSelectedPopup === "string") {
          id = this.popups.findIndex((popup) => popup._addonId === lastSelectedPopup);
          if (id === -1) id = 0;
        }
        this.setPopup(this.popups[id]);
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
            html: `../../../popups/${addonId}/${manifest.popup.html}`,
          });

          this.popups.push(manifest.popup);
          this.popups = this.popups.sort(
            ({ _addonId: addonIdB }, { _addonId: addonIdA }) =>
              TAB_ORDER.indexOf(addonIdB) - TAB_ORDER.indexOf(addonIdA)
          );
        } else {
          let removeIndex = this.popupsWithIframes.findIndex((popup) => popup._addonId === addonId);
          if (removeIndex !== -1) this.popupsWithIframes.splice(removeIndex, 1);
          removeIndex = this.popups.findIndex((popup) => popup._addonId === addonId);
          this.popups.splice(removeIndex, 1);
          if (!this.popups.includes(this.currentPopup)) {
            this.setPopup(this.popups[0]); // set to default popup if current popup is no longer available
          }
        }
      }
    });
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
};

chrome.runtime.sendMessage("checkPermissions");
</script>
<style>
html,
body {
  overflow: hidden;
}
body {
  width: var(--width, 400px);
  height: var(--height, 599px);
  overflow: hidden;
  margin: 0;
  background-color: var(--brand-orange); /* Firefox popup arrow */
  font-family: "Sora", sans-serif;
  color: var(--white-text);
}

[v-cloak] {
  display: none !important;
}

#header {
  display: flex;
  height: 60px;
}
#title-text,
#settings {
  font-size: 18px;
  font-weight: 400;
}
#title {
  flex-grow: 1;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
#logo {
  width: 30px;
  height: 30px;
  margin-inline-end: 20px;
  vertical-align: middle;
}
#settings {
  padding: 0 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
#settings > img {
  width: 24px;
  height: 24px;
}

#popups {
  background-color: var(--content-background);
  width: 100%;
  height: calc(100vh - 60px);
}

#popup-bar {
  padding: 10px;
  padding-bottom: 0px;
  display: flex;
  border-bottom: 1px solid var(--control-border);
}

#popup-chooser {
  display: flex;
  color: var(--content-text);
  height: 35px;
  overflow: hidden;
}
.popup-name {
  display: flex;
  height: 100%;
  box-sizing: border-box;
  align-items: center;
  font-size: 12px;
  padding-inline-start: 10.5px;
  padding-inline-end: 12px;
  background-color: var(--button-background);
  border: 1px solid var(--control-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  transition: 0.2s ease;
}
.popup-name:hover {
  background-color: var(--button-hover-background);
}
.popup-name:not(.sel):hover {
  cursor: pointer;
}
.popup-name:not(:last-child) {
  border-inline-end: none;
}
.popup-name.sel {
  background-color: var(--brand-orange);
  color: var(--white-text);
}
.popup-name img {
  vertical-align: middle;
  filter: var(--content-icon-filter);
  width: 18px;
  height: 18px;
}
.popup-name.sel img {
  filter: brightness(0) invert(1);
}
.popup-title {
  padding-inline-start: 5px;
}
.popout > .popout-img {
  display: inline-block;
  vertical-align: -3px;
  width: 10px;
  height: 10px;
  padding: 2px;
  margin-inline-start: 3px;
  margin-inline-end: -2px;
  border-radius: 2px;
}
.popout:hover > .popout-img {
  background-color: var(--white-text);
  filter: none;
}
[dir="rtl"] .popout > .popout-img {
  transform: scaleX(-1);
}

iframe {
  width: 100%;
  height: calc(100% - 45px);
  overflow-x: hidden;
  border: none;
  overflow-y: scroll;
  background-color: var(--page-background);
}
#version {
  color: var(--white-text);
  margin: 5px;
  text-decoration: none;
  opacity: 0.75;
  font-size: 12px;
}
</style>
