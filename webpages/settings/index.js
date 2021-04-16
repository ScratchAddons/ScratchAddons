import downloadBlob from "../../libraries/download-blob.js";
const NEW_ADDONS = ["drag-drop", "custom-block-shape"];

Vue.directive("click-outside", {
  priority: 700,
  bind() {
    let self = this;
    this.event = function (event) {
      self.vm.$emit(self.expression, event);
    };
    this.el.addEventListener("mousedown", this.stopProp);
    document.body.addEventListener("mousedown", this.event);
  },

  unbind() {
    this.el.removeEventListener("mousedown", this.stopProp);
    document.body.removeEventListener("mousedown", this.event);
  },
  stopProp(event) {
    event.stopPropagation();
  },
});

const ColorInput = Vue.extend({
  props: ["value", "addon", "setting", "no_alpha"],
  template: document.querySelector("template#picker-component").innerHTML,
  data() {
    return {
      isOpen: false,
      color: this.value,
      canCloseOutside: false,
      formats: "",
      opening: false,
    };
  },
  ready() {
    if (this.no_alpha) {
      this.formats = "hex,rgb,hsv,hsl";
    } else {
      this.formats = "hex,hex8,rgb,hsv,hsl";
    }
    this.$els.pickr.addEventListener("input", (e) => {
      this.color = "#" + e.detail.value;
      if (this.value !== this.color) {
        this.$parent.addonSettings[this.addon._addonId][this.setting.id] = "#" + this.$els.pickr.hex8;
        this.$parent.updateSettings(this.addon, { wait: 250, settingId: this.setting.id });
      }
    });
  },
  methods: {
    toggle(addon, setting, value = !this.isOpen) {
      this.isOpen = value;
      this.opening = true;
      this.$root.closePickers({ isTrusted: true }, this);
      this.$root.closeResetDropdowns({ isTrusted: true }); // close other dropdowns
      this.opening = false;

      this.color = "#" + this.$els.pickr.hex8;
      if (this.value !== this.color) {
        this.$parent.addonSettings[addon._addonId][setting.id] = "#" + this.$els.pickr.hex8;
        this.$parent.updateSettings(addon, { wait: 250, settingId: setting.id });
      }
      this.canCloseOutside = false;
      setTimeout(() => {
        this.canCloseOutside = true;
      }, 0);
    },
  },
  watch: {
    value() {
      this.color = this.value;
      this.$els.pickr._valueChanged();
    },
    isOpen() {
      this.$els.pickr._valueChanged();
    },
  },
});
Vue.component("picker", ColorInput);

const ResetDropdown = Vue.extend({
  props: ["addon", "setting", "label", "defaultLabel"],
  template: document.querySelector("template#reset-dropdown-component").innerHTML,
  data() {
    return {
      isResetDropdown: true,
      isOpen: false,
    };
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
      this.$root.closePickers({ isTrusted: true });
      this.$root.closeResetDropdowns({ isTrusted: true }, this); // close other dropdowns
    },
    resetToDefault() {
      this.$parent.addonSettings[this.addon._addonId][this.setting.id] = this.setting.default;
      this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      this.toggle();
    },
    resetToPreset(preset) {
      this.$parent.addonSettings[this.addon._addonId][this.setting.id] = preset.values[this.setting.id];
      this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      this.toggle();
    },
  },
});
Vue.component("reset-dropdown", ResetDropdown);

const browserLevelPermissions = ["notifications", "clipboardWrite"];
let grantedOptionalPermissions = [];
const updateGrantedPermissions = () =>
  chrome.permissions.getAll(({ permissions }) => {
    grantedOptionalPermissions = permissions.filter((p) => browserLevelPermissions.includes(p));
  });
updateGrantedPermissions();
chrome.permissions.onAdded.addListener(updateGrantedPermissions);
chrome.permissions.onRemoved.addListener(updateGrantedPermissions);

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

const vue = (window.vue = new Vue({
  el: "body",
  data: {
    smallMode: false,
    theme: false,
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
    addonsRunningOnTab: false,
    addonToEnable: null,
    showPopupModal: false,
    isIframe: window.parent !== window,
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
      if (!addonManifest._wasEverEnabled) addonManifest._wasEverEnabled = addonManifest._enabled;

      const matchesTag = this.selectedTag === null || addonManifest.tags.includes(this.selectedTag);
      const matchesSearch =
        this.searchInput === "" ||
        addonManifest.name.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        addonManifest._addonId.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        addonManifest.description.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        (addonManifest.credits &&
          addonManifest.credits
            .map((obj) => obj.name.toLowerCase())
            .some((author) => author.includes(this.searchInput.toLowerCase())));
      // Show disabled easter egg addons only if category is easterEgg
      const matchesEasterEgg = addonManifest.tags.includes("easterEgg")
        ? this.selectedTab === "easterEgg" || addonManifest._wasEverEnabled
        : true;

      // April fools
      if (!this._dangoForceWasEverTrue) this._dangoForceWasEverTrue = this.addonSettings["dango-rain"].force;
      if (addonManifest._addonId === "dango-rain") {
        const now = new Date().getTime() / 1000;
        if (this.selectedTab === "easterEgg") {
          // Work normally
          return matchesTag && matchesSearch && matchesEasterEgg;
        } else if (now < 1617364800 && now > 1617192000) {
          // If it's April Fools Day, show even if disabled
          return matchesTag && matchesSearch;
        } else if (addonManifest._wasEverEnabled && this._dangoForceWasEverTrue) {
          // If it's not April Fools Day but dangos are forced, show.
          // Using this._dangoForceWasEverTrue to avoid addon poofing
          // if setting was enabled on load and it's then disabled
          return matchesTag && matchesSearch;
        } else return false;
      }

      return matchesTag && matchesSearch && matchesEasterEgg;
    },
    stopPropagation(e) {
      e.stopPropagation();
    },
    toggleAddonRequest(addon, event) {
      const toggle = () => {
        // Prevents selecting text when the shift key is being help down
        event.preventDefault();

        const newState = !addon._enabled;
        addon._enabled = newState;
        // Do not extend when enabling in popup mode, unless addon has warnings
        addon._expanded =
          document.body.classList.contains("iframe") &&
          !addon._expanded &&
          (addon.info || []).every((item) => item.type !== "warning")
            ? false
            : event.shiftKey
            ? false
            : newState;
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: addon._addonId, newState } });

        if (document.body.classList.contains("iframe")) setTimeout(() => this.popupOrderAddonsEnabledFirst(), 500);
      };

      const requiredPermissions = (addon.permissions || []).filter((value) => browserLevelPermissions.includes(value));
      if (!addon._enabled && requiredPermissions.length) {
        const result = requiredPermissions.every((p) => grantedOptionalPermissions.includes(p));
        if (result === false) {
          if (document.body.classList.contains("iframe")) {
            this.addonToEnable = addon;
            document.querySelector(".popup").style.animation = "dropDown 1.6s 1";
            this.showPopupModal = true;
          } else
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
        if (!settingId || this.addonSettings[addon._addonId][settingId] === value) {
          chrome.runtime.sendMessage({
            changeAddonSettings: { addonId: addon._addonId, newSettings: this.addonSettings[addon._addonId] },
          });
          console.log("Updated", this.addonSettings[addon._addonId]);
        }
      }, wait);
    },
    showResetDropdown(addon, setting) {
      return (
        addon.presets &&
        addon.presets.some((preset) => setting.id in preset.values && preset.values[setting.id] !== setting.default)
      );
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
    closePickers(e, leaveOpen) {
      for (let child of this.$children) {
        if (child.isOpen && child.canCloseOutside && e.isTrusted && child.color && child !== leaveOpen) {
          child.toggle(child.addon, child.setting, false);
        }
      }
    },
    closeResetDropdowns(e, leaveOpen) {
      for (let child of this.$children) {
        if (child.isResetDropdown && e.isTrusted && child !== leaveOpen) {
          child.isOpen = false;
        }
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
    popupOrderAddonsEnabledFirst() {
      return new Promise((resolve) => {
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          if (!tabs[0].id) return;
          chrome.tabs.sendMessage(tabs[0].id, "getRunningAddons", { frameId: 0 }, (res) => {
            // Just so we don't get any errors in the console if we don't get any response from a non scratch tab.
            chrome.runtime.lastError;

            const addonsCurrentlyOnTab = !res
              ? []
              : [...new Set([...res.userscripts, ...res.userstyles])].filter((runningAddonId) => {
                  // Consider addons with "dynamicDisable": true
                  // If those are running on the page, their "is running on this tab"
                  // status should be the same as their "is enabled" status
                  const manifest = this.manifests.find((manifest) => manifest._addonId === runningAddonId);
                  if (manifest.dynamicDisable && !manifest._enabled) return false;
                  return true;
                });
            // Addons that were previously enabled on the tab (but not anymore)
            // should go above enabled addons that are not currently running on the tab
            // so that it's easier to find them, even if the popup was closed.
            // Disabling then reenabling an addon is likely something common
            // so hopefully this saves some seconds of our users' lives :P
            const addonsPreviouslyOnTab = !res
              ? []
              : [...new Set([...res.userscripts, ...res.userstyles, ...res.disabledDynamicAddons])].filter(
                  (runningAddonId) => !addonsCurrentlyOnTab.includes(runningAddonId)
                );

            this.addonsRunningOnTab = Boolean(addonsCurrentlyOnTab.length);

            this.manifests.sort((a, b) =>
              addonsCurrentlyOnTab.includes(a._addonId) && addonsCurrentlyOnTab.includes(b._addonId)
                ? a.name.localeCompare(b.name)
                : addonsCurrentlyOnTab.includes(a._addonId)
                ? -1
                : addonsCurrentlyOnTab.includes(b._addonId)
                ? 1
                : addonsPreviouslyOnTab.includes(a._addonId) && addonsPreviouslyOnTab.includes(b._addonId)
                ? a.name.localeCompare(b.name)
                : addonsPreviouslyOnTab.includes(a._addonId)
                ? -1
                : addonsPreviouslyOnTab.includes(b._addonId)
                ? 1
                : 0
            );

            const currentMarginBottomAddon = this.manifests.find((manifest) => manifest._marginBottom === true);
            if (currentMarginBottomAddon) Vue.set(currentMarginBottomAddon, "_marginBottom", false);
            if (addonsCurrentlyOnTab.length) {
              // Find first addon not currently running on tab
              const firstNonRunningAddonIndex = this.manifests.findIndex(
                (manifest) => !addonsCurrentlyOnTab.includes(manifest._addonId)
              );
              Vue.set(this.manifests[firstNonRunningAddonIndex - 1], "_marginBottom", true);
            }
            resolve();
          });
        });
      });
    },
    openFullSettings() {
      window.open(
        `${chrome.runtime.getURL("webpages/settings/index.html")}#addon-${
          this.addonToEnable && this.addonToEnable._addonId
        }`
      );
      setTimeout(() => window.parent.close(), 100);
    },
    hidePopup() {
      document.querySelector(".popup").style.animation = "closePopup 1.6s 1";
      document.querySelector(".popup").addEventListener(
        "animationend",
        () => {
          this.showPopupModal = false;
        },
        { once: true }
      );
    },
  },
  events: {
    modalClickOutside: function (e) {
      console.log(this.isOpen);
      if (this.isOpen && this.canCloseOutside && e.isTrusted) {
        this.isOpen = false;
      }
    },
    closePickers(e) {
      this.closePickers(e);
    },
    closeResetDropdowns(e) {
      this.closeResetDropdowns(e);
    },
  },

  watch: {
    selectedTab() {
      this.selectedTag = null;
    },
  },
}));

chrome.runtime.sendMessage("getSettingsInfo", async ({ manifests, addonsEnabled, addonSettings }) => {
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
  if (!document.body.classList.contains("iframe")) {
    // New addons should always go first no matter what
    manifests.sort((a, b) =>
      NEW_ADDONS.includes(a.addonId) && NEW_ADDONS.includes(b.addonId)
        ? NEW_ADDONS.indexOf(a.addonId) - NEW_ADDONS.indexOf(b.addonId)
        : NEW_ADDONS.includes(a.addonId)
        ? -1
        : NEW_ADDONS.includes(b.addonId)
        ? 1
        : 0
    );
    vue.manifests = manifests.map(({ manifest }) => manifest);
  } else {
    vue.manifests = manifests.map(({ manifest }) => manifest);
    await vue.popupOrderAddonsEnabledFirst();
  }
  vue.loaded = true;
  setTimeout(() => document.getElementById("searchBox").focus(), 0);
  setTimeout(handleKeySettings, 0);
  setTimeout(() => {
    // Set hash again after loading addons, to force scroll to addon
    let hash = window.location.hash;
    if (hash) {
      window.location.hash = "";
      window.location.hash = hash;
    }
  }, 0);
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

function isElementAboveViewport(el) {
  const rect = el.getBoundingClientRect();
  const elemBottom = rect.bottom;
  return elemBottom >= 0;
}

if (document.body.classList.contains("iframe")) {
  document.querySelector(".addons-block").addEventListener(
    "scroll",
    () => {
      const el = document.querySelector(".addon-body[data-has-margin-bottom]");
      if (!el) return;
      document.querySelector("#running-page").style.opacity = isElementAboveViewport(el) ? 1 : 0;
    },
    { passive: true }
  );
}
