import downloadBlob from "../../libraries/common/cs/download-blob.js";
import globalTheme from "../../libraries/common/global-theme.js";
import Fuse from "../../libraries/thirdparty/cs/fuse.esm.min.js";

//import Fuse from "fuse.js";
import addonGroups from "../data/addon-groups.js";
import categories from "../data/categories.js";
import exampleManifest from "../data/example-manifest.js";
import tags from "../data/tags.js";
import fuseOptions from "../data/fuse-options.js";

import getDirection from "./lib/rtl-list.js";
import bus from "./lib/eventbus";
import { getRunningAddons } from "./lib/tools.js";
import { serializeSettings, deserializeSettings, browserLevelPermissions } from "./lib/serialize";
import Modal from "./components/Modal.vue";
import AddonBody from "./components/AddonBody.vue";
import AddonGroupHeader from "./components/AddonGroupHeader.vue";
import CategorySelector from "./components/CategorySelector.vue";
import { ref } from "vue";

let grantedOptionalPermissions = [];
const updateGrantedPermissions = () =>
  chrome.permissions.getAll(({ permissions }) => {
    grantedOptionalPermissions = permissions.filter((p) => browserLevelPermissions.includes(p));
  });
updateGrantedPermissions();
chrome.permissions.onAdded?.addListener(updateGrantedPermissions);
chrome.permissions.onRemoved?.addListener(updateGrantedPermissions);
let fuse;

let setGlobalTheme;
let isIframe = false;
if (window.parent !== window) {
  // We're in a popup!
  document.body.classList.add("iframe");
  isIframe = true;
}
export default {
  components: { Modal, AddonBody, AddonGroupHeader, CategorySelector },
  data() {
    return {
      bus,
      smallMode: false,
      forceEnglishSetting: null,
      forceEnglishSettingInitial: null,
      switchPath: "../../images/icons/switch.svg",
      moreSettingsOpen: false,
      categoryOpen: true,
      loaded: false,
      searchLoaded: false,
      manifests: [],
      manifestsById: {},
      selectedCategory: "all",
      searchInput: "",
      searchInputReal: "",
      addonSettings: {},
      addonToEnable: null,
      showPopupModal: false,
      isIframe,
      addonGroups: addonGroups.filter((g) => (isIframe ? g.iframeShow : g.fullscreenShow)),
      categories,
      searchMsg: this.msg("search"),
      browserLevelPermissions,
      grantedOptionalPermissions,
      addonListObjs: [],
      sidebarUrls: (() => {
        const uiLanguage = chrome.i18n.getUILanguage();
        const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
        const version = chrome.runtime.getManifest().version;
        const versionName = chrome.runtime.getManifest().version_name;
        const utm = `utm_source=extension&utm_medium=settingspage&utm_campaign=v${version}`;
        return {
          contributors: `https://scratchaddons.com/${localeSlash}credits?${utm}`,
          feedback: `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${versionName}&${utm}`,
          changelog: `https://scratchaddons.com/${localeSlash}changelog?${utm}`,
        };
      })(),
    };
  },
  created() {
    chrome.runtime.sendMessage("getSettingsInfo", async ({ manifests, addonsEnabled, addonSettings }) => {
      this.addonSettings = addonSettings;
      const cleanManifests = [];
      let iframeData;
      if (isIframe) {
        iframeData = await getRunningAddons(manifests, addonsEnabled);
      }
      const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
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
        manifest._wasEverEnabled = manifest._enabled;
        manifest._addonId = addonId;
        manifest._groups = [];

        if (manifest.versionAdded) {
          const [extMajor, extMinor, _] = this.version.split(".");
          const [addonMajor, addonMinor, __] = manifest.versionAdded.split(".");
          if (extMajor === addonMajor && extMinor === addonMinor) {
            manifest.tags.push("new");
            manifest._groups.push(
              manifest.tags.includes("recommended") || manifest.tags.includes("featured") ? "featuredNew" : "new"
            );
          }
        }

        if (manifest.latestUpdate) {
          const [extMajor, extMinor, _] = this.version.split(".");
          const [addonMajor, addonMinor, __] = manifest.latestUpdate.version.split(".");
          if (extMajor === addonMajor && extMinor === addonMinor) {
            manifest.tags.push(manifest.latestUpdate.newSettings?.length ? "updatedWithSettings" : "updated");
            manifest._groups.push(manifest.latestUpdate.isMajor ? "featuredNew" : "new");
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
          else if (manifest.tags.includes("featured")) manifest._groups.push("featured");
          else if (manifest.tags.includes("beta") || manifest.tags.includes("danger")) manifest._groups.push("beta");
          else if (manifest.tags.includes("forums")) manifest._groups.push("forums");
          else manifest._groups.push("others");
        }

        for (const groupId of manifest._groups) {
          this.addonGroups.find((g) => g.id === groupId)?.addonIds.push(manifest._addonId);
        }
        cleanManifests.push(deepClone(manifest));
      }

      // Manifest objects will now be owned by Vue
      for (const { manifest } of manifests) {
        this.manifestsById[manifest._addonId] = manifest;
      }
      this.manifests = manifests.map(({ manifest }) => manifest);

      fuse = new Fuse(cleanManifests, fuseOptions);
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

      this.addonGroups.forEach((group) => {
        group.addonIds = group.addonIds
          .map((id) => this.manifestsById[id])
          .sort((manifestA, manifestB) => {
            for (const tag of group.customOrder || order) {
              const val = checkTag(tag, manifestA, manifestB);
              if (val !== null) return val;
            }
            return 0; // just to suppress linter
          })
          .map((addon) => addon._addonId);
      });

      if (isIframe) {
        const addonsInGroups = [];
        for (const group of this.addonGroups) group.addonIds.forEach((addonId) => addonsInGroups.push(addonId));
        const searchGroup = this.addonGroups.find((group) => group.id === "_iframeSearch");
        searchGroup.addonIds = Object.keys(this.manifestsById).filter(
          (addonId) => addonsInGroups.indexOf(addonId) === -1
        );
      }

      let naturalIndex = 0; // Index when not searching
      for (const group of this.addonGroups) {
        group.addonIds.forEach((addonId, groupIndex) => {
          const cachedObj = this.addonListObjs.find((o) => o.manifest._addonId === "example");
          const obj = cachedObj || {};
          // Some addons might be twice in the list, such as in "new" and "enabled"
          // Before setting manifest, check whether this object will be a duplicate.
          obj.duplicate = Boolean(this.addonListObjs.find((addon) => addon.manifest._addonId === addonId));
          obj.manifest = this.manifestsById[addonId];
          obj.group = group;
          obj.matchesSearch = false; // Later set to true by this.addonList if needed
          const shouldHideAsEasterEgg = obj.manifest._categories[0] === "easterEgg" && obj.manifest._enabled === false;
          obj.matchesCategory = !shouldHideAsEasterEgg;
          obj.naturalIndex = naturalIndex;
          obj.headerAbove = groupIndex === 0;
          obj.footerBelow = groupIndex === group.addonIds.length - 1;
          // Note: when adding new properties here, make sure to also add them to the
          // exampleAddonListItem object on the this.ready method, so that it's reactive!
          if (!cachedObj) this.addonListObjs.push(obj);
          naturalIndex++;
        });
      }
      // Remove unused remaining cached objects. Can only happen in iframe mode
      this.addonListObjs = this.addonListObjs.filter((o) => o.manifest._addonId !== "example");

      this.loaded = true;
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash.startsWith("#addon-")) {
          const addonId = hash.substring(7);
          const groupWithAddon = this.addonGroups.find((group) => group.addonIds.includes(addonId));
          if (!groupWithAddon) return;
          groupWithAddon.expanded = true;

          const addon = this.manifestsById[addonId];
          this.selectedCategory = addon?.tags.includes("easterEgg") ? "easterEgg" : "all";
          setTimeout(() => {
            const addonElem = document.getElementById("addon-" + addonId);
            if (!addonElem) return;
            addonElem.scrollIntoView();
            // Browsers sometimes ignore :target for the elements dynamically appended.
            // Use CSS class to initiate the blink animation.
            addonElem.classList.add("addon-blink");
            // 2s (animation length) + 1ms
            setTimeout(() => addonElem.classList.remove("addon-blink"), 2001);
          }, 0);
        }
      }, 0);

      let binaryNum = "";
      manifests.forEach(({ addonId }) => (binaryNum += addonsEnabled[addonId] === true ? "1" : "0"));
      const addonsEnabledBase36 = BigInt(`0b${binaryNum}`).toString(36);
      this.sidebarUrls.feedback += `#_${addonsEnabledBase36}`;
    });
  },
  computed: {
    themePath() {
      return this.theme ? "../../images/icons/moon.svg" : "../../images/icons/theme.svg";
    },
    addonList() {
      if (!this.searchInput) {
        this.addonListObjs.forEach((obj) => {
          // Hide addons from _iframeSearch pseudogroup when not searching (popup)
          obj.matchesSearch = obj.group.id !== "_iframeSearch";
        });
        return this.addonListObjs.sort((b, a) => b.naturalIndex - a.naturalIndex);
      }

      if (!fuse) return [];
      const addonListObjs = Object.values(
        this.addonListObjs.reduce((acc, cur) => {
          if (
            !acc[cur.manifest._addonId] ||
            (acc[cur.manifest._addonId] && cur.group.id !== "featuredNew" && cur.group.id !== "new")
          ) {
            acc[cur.manifest._addonId] = cur;
          }
          return acc;
        }, Object.create(null))
      );
      const fuseSearch = fuse.search(this.searchInput).sort((a, b) => {
        // Sort very good matches at the top no matter what
        if ((a.score < 0.1) ^ (b.score < 0.1)) return a.score < 0.1 ? -1 : 1;
        // Enabled addons at top
        else return b.item._enabled - a.item._enabled;
      });
      const results = fuseSearch.map((result) =>
        addonListObjs.find((obj) => obj.manifest._addonId === result.item._addonId)
      );
      for (const obj of addonListObjs) obj.matchesSearch = results.includes(obj);
      return addonListObjs.sort((b, a) => results.indexOf(b) - results.indexOf(a));
    },
    hasNoResults() {
      return !this.addonList.some((addon) => addon.matchesSearch && addon.matchesCategory);
    },
    version() {
      return chrome.runtime.getManifest().version;
    },
    versionName() {
      return chrome.runtime.getManifest().version_name;
    },
    addonAmt() {
      return `${Math.floor(this.manifests.filter((addon) => !addon.tags.includes("easterEgg")).length / 5) * 5}+`;
    },
    selectedCategoryName() {
      return this.categories.find((category) => category.id === this.selectedCategory)?.name;
    },
  },
  setup() {
    /*
    Because the theme might take some time to get, we'll use a reactive variable.
     */
    const theme = ref(null);
    (async () => {
      const { theme: asyncTheme, setGlobalTheme: sGT } = await globalTheme();
      theme.value = asyncTheme;
      setGlobalTheme = sGT;
    })();

    // Here we can't return methods!
    return {
      theme,
    };
  },
  methods: {
    openMoreSettings: function () {
      this.closePickers();
      this.moreSettingsOpen = true;
      if (this.smallMode) {
        this.sidebarToggle();
      }
    },
    sidebarToggle: function () {
      this.categoryOpen = !this.categoryOpen;
      if (this.categoryOpen) {
        this.switchPath = "../../images/icons/close.svg";
      } else {
        this.switchPath = "../../images/icons/switch.svg";
      }
    },
    msg(message, ...params) {
      return chrome.i18n.getMessage(message, ...params);
    },
    direction() {
      return getDirection(chrome.i18n.getUILanguage());
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
    clearSearch() {
      this.searchInputReal = "";
    },
    setTheme(mode) {
      setGlobalTheme(mode);
      this.theme = mode;
    },
    stopPropagation(e) {
      e.stopPropagation();
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
      bus.$emit("close-pickers", leaveOpen);
      if (callCloseDropdowns) this.closeResetDropdowns();
    },
    closeResetDropdowns(e, leaveOpen) {
      bus.$emit("close-reset-dropdowns", leaveOpen);
    },
    exportSettings() {
      serializeSettings().then((serialized) => {
        const blob = new Blob([serialized], { type: "application/json" });
        downloadBlob("scratch-addons-settings.json", blob);
      });
    },
    viewSettings() {
      const openedWindow = window.open("about:blank");
      serializeSettings().then((serialized) => {
        const blob = new Blob([serialized], { type: "text/plain" });
        openedWindow.location.replace(URL.createObjectURL(blob));
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
            await deserializeSettings(text, this.manifests, confirmElem);
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
    applyLanguageSettings() {
      alert(chrome.i18n.getMessage("importSuccess"));
      chrome.runtime.reload();
    },
    openFullSettings() {
      window.open(
        `${chrome.runtime.getURL("webpages/dist/index.html")}#addon-${
          this.addonToEnable && this.addonToEnable._addonId
        }`
      );
      setTimeout(() => window.parent.close(), 100);
    },
    hidePopup() {
      document.querySelector(".popup").style.animation = "closePopup 0.6s 1";
      document.querySelector(".popup").addEventListener(
        "animationend",
        () => {
          this.showPopupModal = false;
        },
        { once: true }
      );
    },
    groupShownCount(group) {
      if (group.id === "_iframeSearch") return -1;
      return this.addonListObjs.filter((addon) => addon.group === group && addon.matchesSearch && addon.matchesCategory)
        .length;
    },
    groupMarginAbove(group) {
      const firstVisibleGroup = this.addonGroups.find((group) => this.groupShownCount(group) > 0);
      return group !== firstVisibleGroup;
    },
    closesidebar(event) {
      if (event?.target.classList[0] === "toggle") return;
      if (this.categoryOpen && this.smallMode) {
        this.sidebarToggle();
      }
    },
    resizeEvent() {
      if (window.innerWidth < 1100) {
        this.smallMode = true;
        this.categoryOpen = false;
        this.switchPath = "../../images/icons/switch.svg";
      } else if (this.smallMode !== false) {
        this.smallMode = false;
        this.categoryOpen = true;
        this.switchPath = "../../images/icons/close.svg";
      }
    },
  },

  watch: {
    searchInputReal(newValue) {
      if (newValue === "") return (this.searchInput = newValue);
      setTimeout(() => {
        if (this.searchInputReal === newValue) this.searchInput = newValue;
      }, 150);
    },
    selectedCategory(newValue) {
      this.addonListObjs.forEach((obj) => {
        const shouldHideAsEasterEgg =
          obj.manifest._categories[0] === "easterEgg" &&
          newValue !== "easterEgg" &&
          obj.manifest._wasEverEnabled === false;
        obj.matchesCategory =
          !shouldHideAsEasterEgg && (newValue === "all" || obj.manifest._categories.includes(newValue));
      });
      if (newValue === "forums") this.addonGroups.find((group) => group.id === "forums").expanded = true;
    },
    forceEnglishSetting(newValue, oldValue) {
      if (oldValue !== null) chrome.storage.local.set({ forceEnglish: this.forceEnglishSetting });
    },
  },
  mounted() {
    window.vue = this;

    // Autofocus search bar in iframe mode for both browsers
    // autofocus attribute only works in Chrome for us, so
    // we also manually focus on Firefox, even in fullscreen
    if (isIframe || typeof browser !== "undefined") setTimeout(() => document.getElementById("searchBox")?.focus(), 0);

    const exampleAddonListItem = {
      // Need to specify all used properties for reactivity!
      group: addonGroups[0],
      manifest: JSON.parse(JSON.stringify(exampleManifest)),
      matchesSearch: true,
      matchesCategory: true,
      naturalIndex: -1,
      headerAbove: false,
      footerBelow: false,
      duplicate: false,
    };

    setTimeout(() => {
      if (!this.loaded) {
        this.addonListObjs = Array(25)
          .fill("")
          .map(() => JSON.parse(JSON.stringify(exampleAddonListItem)));
      }
    }, 0);

    chrome.storage.local.get("forceEnglish", ({ forceEnglish }) => {
      this.forceEnglishSettingInitial = forceEnglish;
      this.forceEnglishSetting = forceEnglish;
    });

    window.addEventListener(
      "hashchange",
      (e) => {
        const addonId = location.hash.replace(/^#addon-/, "");
        const groupWithAddon = this.addonGroups.find((group) => group.addonIds.includes(addonId));
        if (!groupWithAddon) return; //Don't run if hash is invalid
        const addon = this.manifestsById[addonId];

        groupWithAddon.expanded = true;
        this.selectedCategory = addon?.tags.includes("easterEgg") ? "easterEgg" : "all";
        this.clearSearch();
        setTimeout(() => document.getElementById("addon-" + addonId)?.scrollIntoView(), 0);
      },
      { capture: false }
    );

    window.addEventListener("resize", this.resizeEvent);
    this.resizeEvent();
    document.title = chrome.i18n.getMessage("settingsTitle");
    let cursor = 0;
    const KONAMI_CODE = [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ];
    let self = this;
    document.addEventListener("keydown", (e) => {
      cursor = e.key.toLowerCase() === KONAMI_CODE[cursor] ? cursor + 1 : 0;
      if (cursor === KONAMI_CODE.length) {
        self.selectedCategory = "easterEgg";
        setTimeout(() => (vue.searchInputReal = ""), 0); // Allow konami code in autofocused search bar
      }
    });
  },
};