import downloadBlob from "../../libraries/download-blob.js";
const NEW_ADDONS = ["data-category-tweaks-v2"];

const browserLevelPermissions = ["notifications", "clipboardWrite"];

//theme switching
const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", "light.css");
chrome.storage.sync.get(["globalTheme"], function (r) {
  let rr = false; //true = light, false = dark
  if (r.globalTheme) rr = r.globalTheme;
  if (rr) {
    document.head.appendChild(lightThemeLink);
    vue.theme = true;
    vue.themePath = "../../images/icons/moon.svg";
  } else {
    vue.theme = false;
    vue.themePath = "../../images/icons/theme.svg";
  }
});

if (window.parent !== window) {
  // We're in a popup!
  document.body.classList.add("iframe");
}

const promisify = (callbackFn) => (...args) => new Promise((resolve) => callbackFn(...args, resolve));

let handleConfirmClicked = null;

const serializeSettings = async () => {
  const syncGet = promisify(chrome.storage.sync.get.bind(chrome.storage.sync));
  const storedSettings = await syncGet(["globalTheme", "addonSettings", "addonsEnabled"]);
  const serialized = {
    core: {
      lightTheme: storedSettings.globalTheme,
      version: chrome.runtime.getManifest().version_name,
    },
    addons: {},
  };
  for (const addonId of Object.keys(storedSettings.addonsEnabled)) {
    serialized.addons[addonId] = {
      enabled: storedSettings.addonsEnabled[addonId],
      settings: storedSettings.addonSettings[addonId] || {},
    };
  }
  return JSON.stringify(serialized);
};

const deserializeSettings = async (str, manifests, confirmElem) => {
  const obj = JSON.parse(str);
  const syncGet = promisify(chrome.storage.sync.get.bind(chrome.storage.sync));
  const syncSet = promisify(chrome.storage.sync.set.bind(chrome.storage.sync));
  const { addonSettings, addonsEnabled } = await syncGet(["addonSettings", "addonsEnabled"]);
  const pendingPermissions = {};
  for (const addonId of Object.keys(obj.addons)) {
    const addonValue = obj.addons[addonId];
    const addonManifest = manifests.find((m) => m._addonId === addonId);
    if (!addonManifest) continue;
    const permissionsRequired = addonManifest.permissions || [];
    const browserPermissionsRequired = permissionsRequired.filter((p) => browserLevelPermissions.includes(p));
    console.log(addonId, permissionsRequired, browserPermissionsRequired);
    if (addonValue.enabled && browserPermissionsRequired.length) {
      pendingPermissions[addonId] = browserPermissionsRequired;
    } else {
      addonsEnabled[addonId] = addonValue.enabled;
    }
    addonSettings[addonId] = Object.assign({}, addonSettings[addonId], addonValue.settings);
  }
  if (handleConfirmClicked) confirmElem.removeEventListener("click", handleConfirmClicked, { once: true });
  let resolvePromise = null;
  const resolveOnConfirmPromise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  handleConfirmClicked = async () => {
    handleConfirmClicked = null;
    if (Object.keys(pendingPermissions).length) {
      const granted = await promisify(chrome.permissions.request.bind(chrome.permissions))({
        permissions: Object.values(pendingPermissions).flat(),
      });
      console.log(pendingPermissions, granted);
      Object.keys(pendingPermissions).forEach((addonId) => {
        addonsEnabled[addonId] = granted;
      });
    }
    await syncSet({
      globalTheme: !!obj.core.lightTheme,
      addonsEnabled,
      addonSettings,
    });
    resolvePromise();
  };
  confirmElem.classList.remove("hidden-button");
  confirmElem.addEventListener("click", handleConfirmClicked, { once: true });
  return resolveOnConfirmPromise;
};

Vue.directive("click-outside", {
  priority: 700,
  bind() {
    let self = this;
    this.event = function (event) {
      console.log("emitting event");
      self.vm.$emit(self.expression, event);
    };
    this.el.addEventListener("click", this.stopProp);
    document.body.addEventListener("click", this.event);
  },

  unbind() {
    console.log("unbind");
    this.el.removeEventListener("click", this.stopProp);
    document.body.removeEventListener("click", this.event);
  },
  stopProp(event) {
    event.stopPropagation();
  },
});

const vue = new Vue({
  el: "body",
  data: {
    smallMode: false,
    theme: "",
    themePath: "",
    switchPath: "../../images/icons/switch.svg",
    isOpen: false,
    canCloseOutside: false,
    categoryOpen: true,
    loaded: false,
    manifests: [],
    selectedTab: "all",
    selectedTag: null,
    searchInput: "",
    addonSettings: {},
    tags: [
      {
        name: chrome.i18n.getMessage("recommended"),
        matchType: "tag",
        matchName: "recommended",
        color: "blue",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          theme: true,
          popup: true,
        },
      },
      {
        name: chrome.i18n.getMessage("beta"),
        matchType: "tag",
        matchName: "beta",
        color: "red",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          theme: true,
          popup: true,
        },
      },
      {
        name: chrome.i18n.getMessage("forums"),
        matchType: "tag",
        matchName: "forums",
        color: "green",
        tabShow: {
          all: false,
          editor: false,
          community: true,
          theme: false,
        },
      },
      {
        name: chrome.i18n.getMessage("forEditor"),
        matchType: "tag",
        matchName: "editor",
        color: "darkgreen",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
      {
        name: chrome.i18n.getMessage("forWebsite"),
        matchType: "tag",
        matchName: "community",
        color: "yellow",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
    ],
  },
  computed: {
    tagsToShow() {
      return this.tags.filter((tag) => tag.tabShow[this.selectedTab]);
    },
    version() {
      return chrome.runtime.getManifest().version;
    },
    versionName() {
      return chrome.runtime.getManifest().version_name;
    },
  },
  methods: {
    closesidebar: function () {
      if (this.categoryOpen && this.smallMode) {
        vue.sidebarToggle();
      }
      if (this.isOpen) {
        this.modalToggle;
      }
    },

    modalToggle: function () {
      this.isOpen = !this.isOpen;
      if (vue.smallMode) {
        vue.sidebarToggle();
      }
      this.canCloseOutside = false;
      setTimeout(() => {
        this.canCloseOutside = true;
      }, 100);
    },
    sidebarToggle: function () {
      this.categoryOpen = !this.categoryOpen;
      if (this.categoryOpen) {
        vue.switchPath = "../../images/icons/close.svg";
      } else {
        vue.switchPath = "../../images/icons/switch.svg";
      }
    },
    msg(message, ...params) {
      return chrome.i18n.getMessage(message, ...params);
    },
    openReview() {
      if (typeof browser !== "undefined") {
        window.open(`https://addons.mozilla.org/en-US/firefox/addon/scratch-messaging-extension/reviews/`);
      } else {
        window.open(
          `https://chrome.google.com/webstore/detail/scratch-addons/fbeffbjdlemaoicjdapfpikkikjoneco/reviews`
        );
      }
    },
    openPage(page) {
      window.open(page);
    },
    openFeedback() {
      window.open(`https://scratchaddons.com/feedback?version=${chrome.runtime.getManifest().version_name}`);
    },
    clearSearch() {
      this.searchInput = "";
    },
    setTheme(mode) {
      chrome.storage.sync.get(["globalTheme"], function (r) {
        let rr = true; //true = light, false = dark
        rr = mode;
        chrome.storage.sync.set({ globalTheme: rr }, function () {
          if (rr && r.globalTheme !== rr) {
            document.head.appendChild(lightThemeLink);
            vue.theme = true;
            vue.themePath = "../../images/icons/moon.svg";
          } else if (r.globalTheme !== rr) {
            document.head.removeChild(lightThemeLink);
            vue.theme = false;
            vue.themePath = "../../images/icons/theme.svg";
          }
        });
      });
    },
    addonMatchesFilters(addonManifest) {
      const matchesTag = this.selectedTag === null || addonManifest.tags.includes(this.selectedTag);
      const matchesSearch =
        this.searchInput === "" ||
        addonManifest.name.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        addonManifest.description.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        (addonManifest.credits &&
          addonManifest.credits
            .map((obj) => obj.name.toLowerCase())
            .some((author) => author.includes(this.searchInput.toLowerCase())));
      // Show disabled easter egg addons only if category is easterEgg
      const matchesEasterEgg = addonManifest.tags.includes("easterEgg")
        ? this.selectedTab === "easterEgg" || addonManifest._enabled
        : true;
      return matchesTag && matchesSearch && matchesEasterEgg;
    },
    stopPropagation(e) {
      e.stopPropagation();
    },
    toggleAddonRequest(addon) {
      const toggle = () => {
        const newState = !addon._enabled;
        addon._enabled = newState;
        addon._expanded = newState;
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: addon._addonId, newState } });
      };

      const requiredPermissions = (addon.permissions || []).filter((value) => browserLevelPermissions.includes(value));
      if (!addon._enabled && requiredPermissions.length) {
        chrome.permissions.request(
          {
            permissions: requiredPermissions,
          },
          (granted) => {
            if (granted) {
              console.log("Permissions granted!");
              toggle();
            }
          }
        );
      } else toggle();
    },
    updateOption(id, newValue, addon) {
      this.addonSettings[addon._addonId][id] = newValue;
      this.updateSettings(addon);
    },
    checkValidity(addon, setting) {
      // Needed to get just changed input to enforce it's min, max, and integer rule if the user "manually" sets the input to a value.
      let input = document.querySelector(
        `input[type='number'][data-addon-id='${addon._addonId}'][data-setting-id='${setting.id}']`
      );
      this.addonSettings[addon._addonId][setting.id] = input.validity.valid ? input.value : setting.default;
    },
    updateSettings(addon, { wait = 0, settingId = null } = {}) {
      const value = settingId && this.addonSettings[addon._addonId][settingId];
      setTimeout(() => {
        if (!settingId || (settingId && this.addonSettings[addon._addonId][settingId] === value)) {
          chrome.runtime.sendMessage({
            changeAddonSettings: { addonId: addon._addonId, newSettings: this.addonSettings[addon._addonId] },
          });
          console.log("Updated", this.addonSettings[addon._addonId]);
        }
      }, wait);
    },
    loadPreset(preset, addon) {
      if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
        for (const property of Object.keys(preset.values)) {
          this.updateOption(property, preset.values[property], addon);
        }
        console.log(`Loaded preset ${preset.id} for ${addon.id}`);
      }
    },
    loadDefaults(addon) {
      if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
        for (const property of addon.settings) {
          this.updateOption(property.id, property.default, addon);
        }
        console.log(`Loaded default values for ${addon.id}`);
      }
    },
    textParse(text, addon) {
      const regex = /([\\]*)(@|#)([a-zA-Z0-9.\-\/_]*)/g;
      return text.replace(regex, (icon) => {
        if (icon[0] === "\\") {
          return icon.slice(1);
        }
        if (icon[0] === "@") {
          return `<img class="inline-icon" src="../../images/icons/${icon.split("@")[1]}"/>`;
        }
        if (icon[0] === "#") {
          return `<img class="inline-icon" src="../../addons/${addon._addonId}/${icon.split("#")[1]}"/>`;
        }
      });
    },
    devShowAddonIds(event) {
      if (!this.versionName.endsWith("-prerelease") || this.shownAddonIds || !event.ctrlKey) return;
      event.stopPropagation();
      this.shownAddonIds = true;
      this.manifests.forEach((manifest) => {
        manifest.name = manifest._addonId;
      });
    },
    exportSettings() {
      serializeSettings().then((serialized) => {
        const blob = new Blob([serialized], { type: "application/json" });
        downloadBlob("scratch-addons-settings.json", blob);
      });
    },
    importSettings() {
      const inputElem = Object.assign(document.createElement("input"), {
        hidden: true,
        type: "file",
        accept: "application/json",
      });
      inputElem.addEventListener(
        "change",
        async (e) => {
          console.log(e);
          const file = inputElem.files[0];
          if (!file) {
            inputElem.remove();
            alert(chrome.i18n.getMessage("fileNotSelected"));
            return;
          }
          const text = await file.text();
          inputElem.remove();
          const confirmElem = document.getElementById("confirmImport");
          try {
            await deserializeSettings(text, vue.manifests, confirmElem);
          } catch (e) {
            console.warn("Error when importing settings:", e);
            confirmElem.classList.add("hidden-button");
            alert(chrome.i18n.getMessage("importFailed"));
            return;
          }
          alert(chrome.i18n.getMessage("importSuccess"));
          chrome.runtime.reload();
        },
        { once: true }
      );
      document.body.appendChild(inputElem);
      inputElem.click();
    },
  },
  events: {
    modalClickOutside: function (e) {
      console.log(this.isOpen);
      if (this.isOpen && this.canCloseOutside && e.isTrusted) {
        this.isOpen = false;
      }
    },
  },
  watch: {
    selectedTab() {
      this.selectedTag = null;
    },
  },
});

chrome.runtime.sendMessage("getSettingsInfo", ({ manifests, addonsEnabled, addonSettings }) => {
  vue.addonSettings = addonSettings;
  for (const { manifest, addonId } of manifests) {
    manifest._category = manifest.popup
      ? "popup"
      : manifest.tags.includes("easterEgg")
      ? "easterEgg"
      : manifest.tags.includes("theme")
      ? "theme"
      : manifest.tags.includes("community")
      ? "community"
      : "editor";
    // Exception:
    if (addonId === "msg-count-badge") manifest._category = "popup";
    manifest._enabled = addonsEnabled[addonId];
    manifest._addonId = addonId;
    manifest._expanded = document.body.classList.contains("iframe") ? false : manifest._enabled;
    manifest._tags = {};
    manifest._tags.recommended = manifest.tags.includes("recommended");
    manifest._tags.beta = manifest.tags.includes("beta");
    manifest._tags.forums = manifest.tags.includes("forums");
    manifest._tags.forEditor = manifest.tags.includes("theme") && manifest.tags.includes("editor");
    manifest._tags.forWebsite = manifest.tags.includes("theme") && manifest.tags.includes("community");
    manifest._tags.new = NEW_ADDONS.includes(addonId);
  }
  // Sort: enabled first, then recommended disabled, then other disabled addons. All alphabetically.
  manifests.sort((a, b) => {
    if (a.manifest._enabled === true && b.manifest._enabled === true)
      return a.manifest.name.localeCompare(b.manifest.name);
    else if (a.manifest._enabled === true && b.manifest._enabled === false) return -1;
    else if (a.manifest._enabled === false && b.manifest._enabled === false) {
      if (a.manifest._tags.recommended === true && b.manifest._tags.recommended === false) return -1;
      else if (a.manifest._tags.recommended === false && b.manifest._tags.recommended === true) return 1;
      else return a.manifest.name.localeCompare(b.manifest.name);
    } else return 1;
  });
  manifests = manifests.filter((a) => !a.manifest.tags.includes("pseudoaddon"));
  if (!document.body.classList.contains("iframe")) {
    // Messaging related addons should always go first no matter what (rule broken below)
    manifests.sort((a, b) => (a.addonId === "msg-count-badge" ? -1 : b.addonId === "msg-count-badge" ? 1 : 0));
    manifests.sort((a, b) => (a.addonId === "scratch-messaging" ? -1 : b.addonId === "scratch-messaging" ? 1 : 0));
    // New addons should always go first no matter what
    manifests.sort((a, b) => (NEW_ADDONS.includes(a.addonId) ? -1 : NEW_ADDONS.includes(b.addonId) ? 1 : 0));
    vue.manifests = manifests.map(({ manifest }) => manifest);
    vue.loaded = true;
  } else {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, "getRunningAddons", undefined, (res) => {
        if (typeof chrome.runtime.lastError == "undefined") {
          let addonIDs = Object.values(res).map((x) => x.addonId);
          manifests.sort((a, b) => (addonIDs.includes(a.addonId) ? -1 : addonIDs.includes(b.addonId) ? 1 : 0));
        }
        vue.manifests = manifests.map(({ manifest }) => manifest);
        vue.loaded = true;
      });
    });
  }
  setTimeout(() => document.getElementById("searchBox").focus(), 0);
  setTimeout(handleKeySettings, 0);
});

function handleKeySettings() {
  let keyInputs = document.querySelectorAll(".key");
  for (const input of keyInputs) {
    input.addEventListener("keydown", function (e) {
      e.preventDefault();
      e.target.value = e.ctrlKey
        ? "Ctrl" +
          (e.shiftKey ? " + Shift" : "") +
          (e.key === "Control" || e.key === "Shift"
            ? ""
            : (e.ctrlKey ? " + " : "") +
              (e.key.toUpperCase() === e.key
                ? e.code.includes("Digit")
                  ? e.code.substring(5, e.code.length)
                  : e.key
                : e.key.toUpperCase()))
        : "";
      vue.updateOption(
        e.target.getAttribute("data-setting-id"),
        e.target.value,
        vue.manifests.find((manifest) => manifest._addonId === e.target.getAttribute("data-addon-id"))
      );
    });
    input.addEventListener("keyup", function (e) {
      // Ctrl by itself isn't a hotkey
      if (e.target.value === "Ctrl") e.target.value = "";
    });
  }
}

window.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "f") {
    e.preventDefault();
    document.querySelector("#searchBox").focus();
  } else if (e.key === "Escape" && document.activeElement === document.querySelector("#searchBox")) {
    e.preventDefault();
    vue.searchInput = "";
  }
});

document.title = chrome.i18n.getMessage("settingsTitle");
function resize() {
  if (window.innerWidth < 1000) {
    vue.smallMode = true;
    vue.categoryOpen = false;
    vue.switchPath = "../../images/icons/switch.svg";
  } else if (vue.smallMode !== false) {
    vue.smallMode = false;
    vue.categoryOpen = true;
    vue.switchPath = "../../images/icons/close.svg";
  }
}
window.onresize = resize;
resize();

// Konami code easter egg
let cursor = 0;
const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];
document.addEventListener("keydown", (e) => {
  cursor = e.code === KONAMI_CODE[cursor] ? cursor + 1 : 0;
  if (cursor === KONAMI_CODE.length) {
    vue.selectedTab = "easterEgg";
    setTimeout(() => (vue.searchInput = ""), 0); // Allow konami code in autofocused search bar
  }
});

chrome.runtime.sendMessage("checkPermissions");
