import downloadBlob from "../../libraries/common/cs/download-blob.js";

let isIframe = false;
if (window.parent !== window) {
  // We're in a popup!
  document.body.classList.add("iframe");
  isIframe = true;
}

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
      loadColorPicker: false, // #2090 tempfix
    };
  },
  ready() {
    if (!this.loadColorPicker) return;
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
    this.$root.$on("close-pickers", (except) => {
      if (this.isOpen && this !== except) {
        const addon = this.$parent.addon;
        const setting = this.$parent.setting;
        this.toggle(addon, setting, false, {
          // I trust callers
          callCloseDropdowns: false,
          callClosePickers: false,
        });
      }
    });
  },
  computed: {
    noAlphaString() {
      return String(this.no_alpha);
    },
  },
  methods: {
    toggle(addon, setting, value = !this.isOpen, { callCloseDropdowns = true, callClosePickers = true } = {}) {
      if (!this.loadColorPicker) return;
      this.isOpen = value;
      this.opening = true;
      if (callClosePickers)
        this.$root.closePickers({ isTrusted: true }, this, {
          callCloseDropdowns: false,
        });
      if (callCloseDropdowns) this.$root.closeResetDropdowns({ isTrusted: true }); // close other dropdowns
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
      // ?. is #2090 tempfix, 4 lines below as well
      this.$els.pickr?._valueChanged();
    },
    isOpen() {
      this.$els.pickr?._valueChanged();
    },
    loadColorPicker() {
      this.$options.ready[0].call(this);
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
  ready() {
    this.$root.$on("close-reset-dropdowns", (except) => {
      if (this.isOpen && this !== except) {
        this.isOpen = false;
      }
    });
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
      this.$root.closePickers({ isTrusted: true }, null, {
        callCloseDropdowns: false,
      });
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

const AddonGroup = Vue.extend({
  props: ["group"],
  template: document.querySelector("template#addon-group-component").innerHTML,
  data() {
    return {};
  },
  computed: {
    shouldShow() {
      if (this.group.id === "new" && this.$root.searchInput !== "") return false;
      return this.shownCount > 0;
    },
    shownCount() {
      // Recompute after root loaded
      void this.$root.loaded;

      return this.$children.filter((addon) => addon.shouldShow).length;
    },
    manifestsById() {
      return this.$root.manifestsById;
    },
  },
  methods: {
    toggle() {
      this.group.expanded = !this.group.expanded;
    },
  },
});
Vue.component("addon-group", AddonGroup);

const AddonBody = Vue.extend({
  props: ["addon", "groupId", "groupExpanded"],
  template: document.querySelector("template#addon-body-component").innerHTML,
  data() {
    return {
      expanded: isIframe ? false : this.groupId === "enabled",
    };
  },
  computed: {
    shouldShow() {
      const matches =
        this.$root.selectedCategory === "all" || this.addon._categories.includes(this.$root.selectedCategory);
      if (matches) return this.addonMatchesFilters;
      else return false;
    },
    searchInput() {
      return this.$root.searchInput;
    },
    addonSettings() {
      return this.$root.addonSettings;
    },
    addonMatchesFilters() {
      if (this.groupId !== "search" && this.searchInput !== "") return false;
      if (!this.addon._wasEverEnabled) this.addon._wasEverEnabled = this.addon._enabled;

      const search = this.searchInput.toLowerCase();

      const matchesSearch =
        this.searchInput === "" ||
        this.addon.name.toLowerCase().includes(search) ||
        this.addon._addonId.toLowerCase().includes(search) ||
        this.addon.description.toLowerCase().includes(search) ||
        (this.addon.credits &&
          this.addon.credits.map((obj) => obj.name.toLowerCase()).some((author) => author.includes(search)));
      // Show disabled easter egg addons only if category is easterEgg
      const matchesEasterEgg = this.addon.tags.includes("easterEgg")
        ? this.$root.selectedCategory === "easterEgg" || this.addon._wasEverEnabled
        : true;

      return matchesSearch && matchesEasterEgg;
    },
  },
  methods: {
    devShowAddonIds(event) {
      if (!this.$root.versionName.endsWith("-prerelease") || !event.ctrlKey) return;
      event.stopPropagation();
      Vue.set(this.addon, "_displayedAddonId", this.addon._addonId);
    },
    loadPreset(preset) {
      if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
        for (const property of Object.keys(preset.values)) {
          this.$root.addonSettings[this.addon._addonId][property] = preset.values[property];
        }
        this.$root.updateSettings(this.addon);
        console.log(`Loaded preset ${preset.id} for ${this.addon._addonId}`);
      }
    },
    loadDefaults() {
      if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
        for (const property of this.addon.settings) {
          this.$root.addonSettings[this.addon._addonId][property.id] = property.default;
        }
        this.$root.updateSettings(this.addon);
        console.log(`Loaded default values for ${this.addon._addonId}`);
      }
    },
    toggleAddonRequest(event) {
      const toggle = () => {
        // Prevents selecting text when the shift key is being held down
        event.preventDefault();

        const newState = !this.addon._enabled;
        this.addon._enabled = newState;
        // Do not extend when enabling in popup mode, unless addon has warnings
        this.expanded =
          isIframe && !this.expanded && (this.addon.info || []).every((item) => item.type !== "warning")
            ? false
            : event.shiftKey
            ? false
            : newState;
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: this.addon._addonId, newState } });
      };

      const requiredPermissions = (this.addon.permissions || []).filter((value) =>
        browserLevelPermissions.includes(value)
      );
      if (!this.addon._enabled && this.addon.tags.includes("danger")) {
        const confirmation = confirm(chrome.i18n.getMessage("dangerWarning", [this.addon.name]));
        if (!confirmation) return;
      }
      if (!this.addon._enabled && requiredPermissions.length) {
        const result = requiredPermissions.every((p) => grantedOptionalPermissions.includes(p));
        if (result === false) {
          if (isIframe) {
            this.$root.addonToEnable = this.addon;
            document.querySelector(".popup").style.animation = "dropDown 1.6s 1";
            this.$root.showPopupModal = true;
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
    msg(...params) {
      return this.$root.msg(...params);
    },
  },
});
Vue.component("addon-body", AddonBody);

// Tags in order
const tags = [
  {
    name: "danger",
    tooltipText: "dangerTooltip",
    matchName: "danger",
    color: "darkred",
    iframeAlwaysShow: true,
  },
  {
    name: "recommended",
    tooltipText: "recommendedTooltip",
    matchName: "recommended",
    color: "blue",
  },
  {
    name: "new",
    matchName: "new",
    color: "purple",
  },
  {
    name: "beta",
    tooltipText: "betaTooltip",
    matchName: "beta",
    color: "red",
    iframeAlwaysShow: true,
  },
  {
    name: "forums",
    tooltipText: "forumsTooltip",
    matchName: "forums",
    color: "green",
  },
  {
    name: "forEditor",
    matchName: "editor",
    color: "darkgreen",
    addonTabShow: {
      theme: true,
    },
  },
  {
    name: "forWebsite",
    matchName: "community",
    color: "yellow",
    addonTabShow: {
      theme: true,
    },
  },
];
const AddonTag = Vue.extend({
  props: ["tag"],
  template: document.querySelector("template#addon-tag-component").innerHTML,
  data() {
    return {};
  },
  computed: {
    tagInfo() {
      // Might return undefined, tag might not exist
      return tags.find((tag) => tag.matchName === this.tag);
    },
    shouldShow() {
      if (isIframe) return this.tagInfo && this.tagInfo.iframeAlwaysShow;
      return this.tagInfo && (!this.tagInfo.addonTabShow || this.tagInfo.addonTabShow[this.$root.selectedCategory]);
    },
    tagName() {
      return chrome.i18n.getMessage(this.tagInfo.name);
    },
    tagTooltip() {
      return chrome.i18n.getMessage(this.tagInfo.tooltipText);
    },
  },
});
Vue.component("addon-tag", AddonTag);

const AddonSetting = Vue.extend({
  props: ["addon", "setting", "addon-settings"],
  template: document.querySelector("template#addon-setting-component").innerHTML,
  data() {
    return {};
  },
  methods: {
    settingsName(addon) {
      const name = this.setting.name;
      const regex = /([\\]*)(@|#)([a-zA-Z0-9.\-\/_]*)/g;
      return name.replace(regex, (icon) => {
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

    showResetDropdown() {
      return (
        this.addon.presets &&
        this.addon.presets.some(
          (preset) => this.setting.id in preset.values && preset.values[this.setting.id] !== this.setting.default
        )
      );
    },
    checkValidity() {
      // Needed to get just changed input to enforce it's min, max, and integer rule if the user "manually" sets the input to a value.
      let input = document.querySelector(
        `input[type='number'][data-addon-id='${this.addon._addonId}'][data-setting-id='${this.setting.id}']`
      );
      this.addonSettings[this.addon._addonId][this.setting.id] = input.validity.valid
        ? input.value
        : this.setting.default;
    },
    msg(...params) {
      return this.$root.msg(...params);
    },
    updateSettings(...params) {
      if (!params[0]) params[0] = this.addon;
      this.$root.updateSettings(...params);
    },
    updateOption(newValue) {
      this.$root.updateOption(this.setting.id, newValue, this.addon);
    },
  },
  events: {
    closePickers(...params) {
      return this.$root.closePickers(...params);
    },
    closeResetDropdowns(...params) {
      return this.$root.closeResetDropdowns(...params);
    },
  },
});
Vue.component("addon-setting", AddonSetting);

const CategorySelector = Vue.extend({
  props: ["category"],
  template: document.querySelector("template#category-selector-component").innerHTML,
  data() {
    return {};
  },
  computed: {
    selectedCategory() {
      return this.$root.selectedCategory;
    },
    shouldShow() {
      const categoriesWithParent = this.$root.categories
        .filter((category) => category.parent === this.category.parent)
        .map((category) => category.id);
      return !this.category.parent || [this.category.parent, ...categoriesWithParent].includes(this.selectedCategory);
    },
  },
  methods: {
    onClick(event) {
      event.stopPropagation();
      this.$root.selectedCategory = this.category.id;
    },
  },
});
Vue.component("category-selector", CategorySelector);

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

const addonGroups = [
  // Only popup:
  {
    id: "recentlyUsed",
    name: chrome.i18n.getMessage("recentlyUsed"),
    addonIds: [],
    expanded: true,
    iframeShow: true,
    fullscreenShow: false,
  },
  {
    id: "runningOnTab",
    name: chrome.i18n.getMessage("runningOnThisPage"),
    addonIds: [],
    expanded: true,
    iframeShow: true,
    fullscreenShow: false,
  },

  {
    id: "new",
    name: chrome.i18n.getMessage("new"),
    addonIds: [],
    expanded: true,
    iframeShow: false,
    fullscreenShow: true,
  },
  {
    id: "enabled",
    name: chrome.i18n.getMessage("enabled"),
    addonIds: [],
    expanded: true,
    iframeShow: true,
    fullscreenShow: true,
  },
  {
    id: "recommended",
    name: chrome.i18n.getMessage("recommended"),
    addonIds: [],
    expanded: true,
    iframeShow: false,
    fullscreenShow: true,
  },
  {
    id: "others",
    name: chrome.i18n.getMessage("others"),
    addonIds: [],
    expanded: true,
    iframeShow: false,
    fullscreenShow: true,
  },
  {
    id: "beta",
    name: chrome.i18n.getMessage("beta"),
    addonIds: [],
    expanded: false,
    iframeShow: false,
    fullscreenShow: true,
  },
];

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
    manifestsById: {},
    searchAddonOrder: [],
    selectedCategory: "all",
    searchInput: "",
    addonSettings: {},
    addonToEnable: null,
    showPopupModal: false,
    isIframe,
    addonGroups: addonGroups.filter((g) => (isIframe ? g.iframeShow : g.fullscreenShow)),
    categories: [
      {
        id: "all",
        icon: "list",
        name: chrome.i18n.getMessage("all"),
      },
      {
        id: "editor",
        icon: "puzzle",
        name: chrome.i18n.getMessage("editorFeatures"),
      },
      {
        id: "codeEditor",
        parent: "editor",
        icon: "code",
        name: chrome.i18n.getMessage("codeEditorFeatures"),
      },
      {
        id: "costumeEditor",
        parent: "editor",
        icon: "brush2",
        name: chrome.i18n.getMessage("costumeEditorFeatures"),
      },
      {
        id: "projectPlayer",
        parent: "editor",
        icon: "player",
        name: chrome.i18n.getMessage("projectPlayerFeatures"),
      },
      {
        id: "editorOthers",
        parent: "editor",
        icon: "dots",
        name: chrome.i18n.getMessage("others"),
      },
      {
        id: "community",
        icon: "web",
        name: chrome.i18n.getMessage("websiteFeatures"),
      },
      {
        id: "projectPage",
        parent: "community",
        icon: "projectpage",
        name: chrome.i18n.getMessage("projectPageFeatures"),
      },
      {
        id: "profiles",
        parent: "community",
        icon: "users",
        name: chrome.i18n.getMessage("profilesFeatures"),
      },
      {
        id: "forums",
        parent: "community",
        icon: "forum",
        name: chrome.i18n.getMessage("forums"),
      },
      {
        id: "communityOthers",
        parent: "community",
        icon: "dots",
        name: chrome.i18n.getMessage("others"),
      },
      {
        id: "theme",
        icon: "brush",
        name: chrome.i18n.getMessage("themes"),
      },
      {
        id: "themesForEditor",
        parent: "theme",
        icon: "puzzle",
        name: chrome.i18n.getMessage("editorThemes"),
      },
      {
        id: "themesForWebsite",
        parent: "theme",
        icon: "web",
        name: chrome.i18n.getMessage("websiteThemes"),
      },
      {
        id: "popup",
        icon: "popup",
        name: chrome.i18n.getMessage("popupFeatures"),
        marginBottom: true,
      },
    ],
  },
  computed: {
    version() {
      return chrome.runtime.getManifest().version;
    },
    versionName() {
      return chrome.runtime.getManifest().version_name;
    },
    addonAmt() {
      return `${Math.floor(this.manifests.length / 5) * 5}+`;
    },
  },

  methods: {
    modalToggle: function () {
      this.closePickers();
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
    stopPropagation(e) {
      e.stopPropagation();
    },
    updateOption(id, newValue, addon) {
      this.addonSettings[addon._addonId][id] = newValue;
      this.updateSettings(addon);
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
    closePickers(e, leaveOpen, { callCloseDropdowns = true } = {}) {
      this.$emit("close-pickers", leaveOpen);
      if (callCloseDropdowns) this.closeResetDropdowns();
    },
    closeResetDropdowns(e, leaveOpen) {
      this.$emit("close-reset-dropdowns", leaveOpen);
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
    closesidebar(event) {
      if (event?.target.classList[0] === "toggle") return;
      if (this.categoryOpen && this.smallMode) {
        this.sidebarToggle();
      }
    },
    modalClickOutside: function (e) {
      if (this.isOpen && this.canCloseOutside && e.isTrusted) {
        this.isOpen = false;
      }
    },
  },
}));

const getRunningAddons = (manifests, addonsEnabled) => {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (!tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, "getRunningAddons", { frameId: 0 }, (res) => {
        // Just so we don't get any errors in the console if we don't get any response from a non scratch tab.
        void chrome.runtime.lastError;
        const addonsCurrentlyOnTab = res ? [...res.userscripts, ...res.userstyles] : [];
        const addonsPreviouslyOnTab = res ? res.disabledDynamicAddons : [];
        resolve({ addonsCurrentlyOnTab, addonsPreviouslyOnTab });
      });
    });
  });
};

chrome.runtime.sendMessage("getSettingsInfo", async ({ manifests, addonsEnabled, addonSettings }) => {
  vue.addonSettings = addonSettings;
  let iframeData;
  if (isIframe) {
    iframeData = await getRunningAddons(manifests, addonsEnabled);
  }
  for (const { manifest, addonId } of manifests) {
    manifest._categories = [];
    manifest._categories[0] = manifest.tags.includes("popup")
      ? "popup"
      : manifest.tags.includes("easterEgg")
      ? "easterEgg"
      : manifest.tags.includes("theme")
      ? "theme"
      : manifest.tags.includes("community")
      ? "community"
      : "editor";

    const addCategoryIfTag = (arr) => {
      let count = 0;
      for (const objOrString of arr) {
        const tagName = typeof objOrString === "object" ? objOrString.tag : objOrString;
        const categoryName = typeof objOrString === "object" ? objOrString.category : tagName;
        if (manifest.tags.includes(tagName)) {
          manifest._categories.push(categoryName);
          count++;
        }
      }
      return count;
    };
    if (manifest._categories[0] === "theme") {
      // All themes should have either "editor" or "community" tag
      addCategoryIfTag([
        {
          tag: "editor",
          category: "themesForEditor",
        },
      ]) ||
        addCategoryIfTag([
          {
            tag: "community",
            category: "themesForWebsite",
          },
        ]);
    } else if (manifest._categories[0] === "editor") {
      const addedCategories = addCategoryIfTag(["codeEditor", "costumeEditor", "projectPlayer"]);
      if (addedCategories === 0) manifest._categories.push("editorOthers");
    } else if (manifest._categories[0] === "community") {
      const addedCategories = addCategoryIfTag(["profiles", "projectPage", "forums"]);
      if (addedCategories === 0) manifest._categories.push("communityOthers");
    }

    // Exception: show cat-blocks after konami code, even tho
    // it's categorized as an editor addon, not as easterEgg
    if (addonId === "cat-blocks") manifest._categories.push("easterEgg");

    manifest._icon = manifest._categories[0];

    manifest._enabled = addonsEnabled[addonId];
    manifest._addonId = addonId;
    manifest._groups = [];

    if (manifest.versionAdded) {
      const [extMajor, extMinor, _] = vue.version.split(".");
      const [addonMajor, addonMinor, __] = manifest.versionAdded.split(".");
      if (extMajor === addonMajor && extMinor === addonMinor) {
        manifest.tags.push("new");
        manifest._groups.push("new");
      }
    }

    // Sort tags to preserve consistent order
    const order = tags.map((obj) => obj.matchName);
    manifest.tags.sort((b, a) => order.indexOf(b) - order.indexOf(a));

    // Iframe only
    if (iframeData?.addonsCurrentlyOnTab.includes(addonId)) manifest._groups.push("runningOnTab");
    else if (iframeData?.addonsPreviouslyOnTab.includes(addonId)) manifest._groups.push("recentlyUsed");

    if (manifest._enabled) manifest._groups.push("enabled");
    else {
      // Addon is disabled
      if (manifest.tags.includes("recommended")) manifest._groups.push("recommended");
      else if (manifest.tags.includes("beta") || manifest.tags.includes("danger")) manifest._groups.push("beta");
      else manifest._groups.push("others");
    }

    for (const groupId of manifest._groups) {
      vue.addonGroups.find((g) => g.id === groupId)?.addonIds.push(manifest._addonId);
    }

    Vue.set(vue.manifestsById, manifest._addonId, manifest);
  }
  vue.manifests = manifests.map(({ manifest }) => manifest);

  const checkTag = (tagOrTags, manifestA, manifestB) => {
    const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags];
    const aHasTag = tags.some((tag) => manifestA.tags.includes(tag));
    const bHasTag = tags.some((tag) => manifestB.tags.includes(tag));
    if (aHasTag ^ bHasTag) {
      // If only one has the tag
      return bHasTag - aHasTag;
    } else if (aHasTag && bHasTag) return manifestA.name.localeCompare(manifestB.name);
    else return null;
  };
  const order = [["danger", "beta"], "editor", "community", "popup"];

  vue.addonGroups.forEach((group) => {
    group.addonIds = group.addonIds
      .map((id) => vue.manifestsById[id])
      .sort((manifestA, manifestB) => {
        for (const tag of order) {
          const val = checkTag(tag, manifestA, manifestB);
          if (val !== null) return val;
        }
        return 0; // just to suppress linter
      })
      .map((addon) => addon._addonId);
  });

  // Define order when searching. Temporal until we
  // can sort by relevance depending on the query
  vue.searchAddonOrder = manifests
    .sort((a, b) => {
      if (a.manifest._enabled ^ b.manifest._enabled) return b.manifest._enabled - a.manifest._enabled;
      else return a.manifest.name.localeCompare(b.manifest.name);
    })
    .map((obj) => obj.addonId);

  vue.loaded = true;
  setTimeout(() => document.getElementById("searchBox").focus(), 0);
  setTimeout(handleKeySettings, 0);
  setTimeout(() => {
    // Set hash again after loading addons, to force scroll to addon
    let hash = window.location.hash;
    if (hash) {
      window.location.hash = "";
      window.location.hash = hash;
      if (hash.startsWith("#addon-")) {
        const groupWithAddon = vue.$children.find(
          (child) =>
            child.$options.name === "addon-group" &&
            child.$children.find((addon) => "#addon-" + addon.addon._addonId === location.hash)
        );
        if (groupWithAddon && !groupWithAddon.group.expanded) groupWithAddon.toggle();
      }
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
    vue.selectedCategory = "easterEgg";
    setTimeout(() => (vue.searchInput = ""), 0); // Allow konami code in autofocused search bar
  }
});

chrome.runtime.sendMessage("checkPermissions");
