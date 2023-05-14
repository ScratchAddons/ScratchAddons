<template>
  <div class="navbar">
    <img :src="switchPath" class="toggle" @click="sidebarToggle()" v-cloak v-show="smallMode" alt="Logo" />
    <img src="../../images/icon-transparent.svg" class="logo" alt="Logo" />
    <h1 v-cloak>{{ msg("settings") }}</h1>
    <img v-cloak @click="setTheme(!theme)" class="theme-switch" :src="themePath" />
  </div>
  <div class="main">
    <div
      class="categories-block"
      v-click-outside="closesidebar"
      v-show="categoryOpen && !isIframe"
      :class="{ smallMode: smallMode === true }"
    >
      <category-selector v-for="category of categories" :category="category"></category-selector>

      <a
        v-cloak
        class="category category-small"
        style="margin-top: auto"
        :href="sidebarUrls.contributors"
        target="_blank"
      >
        <img src="../../images/icons/users.svg" />
        <span>{{ msg("credits") }} <img src="../../images/icons/popout.svg" /></span>
      </a>
      <!--
        <div class="category category-small" @click="openReview()">
          <img src="../../images/icons/star.svg" />
          <span v-cloak>{{ msg("review") }}</span>
        </div>
        -->
      <a v-cloak class="category category-small" href="https://scratchaddons.com/translate" target="_blank">
        <img src="../../images/icons/translate.svg" />
        <span>{{ msg("translate") }} <img src="../../images/icons/popout.svg" /></span>
      </a>
      <a
        v-cloak
        class="category category-small"
        href="https://scratchaddons.com/feedback/"
        :href="sidebarUrls.feedback"
        target="_blank"
      >
        <img src="../../images/icons/comment.svg" />
        <span>{{ msg("feedback") }} <img src="../../images/icons/popout.svg" /></span>
      </a>
      <div v-cloak class="category" style="margin-top: 12px; margin-bottom: 14px" @click="openMoreSettings()">
        <img src="../../images/icons/wrench.svg" />
        <span>{{ msg("moreSettings") }}</span>
      </div>
    </div>
    <div v-show="!isIframe && smallMode === false" class="categories-shrink" @click="sidebarToggle()">
      <img src="../../images/icons/left-arrow.svg" :class="{ flipped: categoryOpen === (direction() === 'rtl') }" />
    </div>

    <!-- This is the main menu, where the searchbar and the addon items are located -->
    <div class="addons-block">
      <div v-cloak class="search-box" :class="{ smallMode: smallMode === true }">
        <input type="text" id="searchBox" :placeholder="searchMsg" v-model="searchInputReal" autofocus />
        <button v-show="searchInput === ''" class="search-button"></button>
        <button v-show="searchInput !== ''" class="search-clear-button" @click="clearSearch()"></button>
      </div>

      <div class="addons-container" :class="{ placeholder: !loaded }" v-cloak>
        <template v-if="searchInput && hasNoResults">
          <p id="search-not-found" v-if="selectedCategory === 'all' || !selectedCategoryName">
            {{ msg("searchNotFound") }}
          </p>
          <p id="search-not-found" v-else>{{ msg("searchNotFoundInCategory", selectedCategoryName) }}</p>
        </template>
        <template v-for="addon of addonList">
          <div
            id="iframe-fullscreen-suggestion"
            v-if="isIframe && addon.headerAbove && (hasNoResults || addon.group.id === 'enabled')"
            v-show="searchInput === ''"
          >
            <span>{{ msg("exploreAllAddons", [addonAmt]) }}</span>
            <button class="large-button" @click="openFullSettings()">{{ msg("openFullSettings") }}</button>
          </div>
          <addon-group-header
            v-if="addon.headerAbove"
            :group="addon.group"
            :shown-count="groupShownCount(addon.group)"
            :margin-above="groupMarginAbove(addon.group)"
          ></addon-group-header>
          <addon-body
            :visible="addon.matchesSearch && addon.matchesCategory"
            :addon="addon.manifest"
            :group-id="addon.group.id"
            :group-expanded="addon.group.expanded"
          ></addon-body>
        </template>
      </div>
    </div>
  </div>

  <modal class="more-settings" :is-open.sync="moreSettingsOpen" :title="msg('moreSettings')" v-cloak>
    <div class="addon-block settings-block">
      <div class="addon-body">
        <div class="addon-topbar">
          <span class="addon-name"
            ><img src="../../images/icons/theme.svg" class="icon-type" /> {{ msg("scratchAddonsTheme") }}
          </span>
        </div>
        <div class="addon-settings">
          <span class="addon-description-full">{{ msg("scratchAddonsThemeDescription") }}</span>
          <div class="addon-setting">
            <div class="filter-selector">
              <div class="filter-text">{{ msg("theme") }}</div>
              <div class="filter-options">
                <div class="filter-option" :class="{ sel: theme === true }" @click="setTheme(true)">
                  {{ msg("light") }}
                </div>
                <div class="filter-option" :class="{ sel: theme === false }" @click="setTheme(false)">
                  {{ msg("dark") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="addon-body">
        <div class="addon-topbar">
          <span class="addon-name"
            ><img src="../../images/icons/import-export.svg" class="icon-type" :class="{ dark: theme === false }" />
            {{ msg("exportAndImportSettings") }}
          </span>
        </div>
        <div class="addon-settings">
          <span class="addon-description-full">{{ msg("exportAndImportSettingsDescription") }}</span>
          <span class="addon-description-full">{{ msg("useBrowserSync") }}</span>
          <div class="addon-setting">
            <div class="filter-selector">
              <button class="large-button" @click="exportSettings()">{{ msg("export") }}</button>
            </div>
            <div class="filter-selector">
              <button class="large-button" @click="importSettings()">{{ msg("import") }}</button>
              <button class="large-button hidden-button" id="confirmImport">{{ msg("confirmImport") }}</button>
            </div>
            <div class="filter-selector" style="margin-left: 16px">
              <button class="large-button" @click="viewSettings()">{{ msg("viewSettings") }}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="addon-body">
        <div class="addon-topbar">
          <span class="addon-name"
            ><img src="../../images/icons/translate.svg" class="icon-type" />{{ msg("language") }}
          </span>
        </div>
        <div class="addon-settings">
          <div class="addon-setting" style="margin-top: 0">
            <input
              type="checkbox"
              class="setting-input check"
              v-model="forceEnglishSetting"
              style="margin-inline-start: 0; margin-inline-end: 8px"
            />
            <span>Show addon names and descriptions in English</span>
            <div class="badge red">{{ msg("beta") }}</div>
            <button
              class="large-button"
              id="applyLanguageSettingsButton"
              v-show="forceEnglishSetting !== null && forceEnglishSetting !== this.forceEnglishSettingInitial"
              @click="applyLanguageSettings()"
              style="margin-inline-start: 16px"
            >
              {{ msg("applySettings") }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>
        {{ msg("extensionName") }}
        <a
          href="https://scratchaddons.com/changelog"
          :href="sidebarUrls.changelog"
          title="{{ msg('changelog') }}"
          target="_blank"
        >
          v{{ version }}</a
        >
      </p>
      <p>
        <a
          href="./licenses.html?libraries=icu-message-formatter,vue,color-picker-web-component,comlink,Sora,fuse,idb,sortable"
          target="_blank"
          >{{ msg("libraryCredits") }}</a
        >
      </p>
    </div>
  </modal>
  <div class="popup" v-cloak v-show="showPopupModal">
    <div class="label">{{ msg("settingsPagePermission", addonToEnable ? addonToEnable.name : "") }}</div>
    <div>
      <button class="large-button" @click="openFullSettings()">{{ msg("openFullSettings") }}</button>
      <button class="large-button" @click="hidePopup()">{{ msg("skipOpenFullSettings") }}</button>
    </div>
  </div>
</template>

<script>
import downloadBlob from "../../libraries/common/cs/download-blob.js";
import globalTheme from "../../libraries/common/global-theme.js";

import Fuse from "fuse.js";
import addonGroups from "../data/addon-groups.js";
import categories from "../data/categories.js";
import exampleManifest from "../data/example-manifest.js";
import tags from "../data/tags.js";
import fuseOptions from "../data/fuse-options.js";

import getDirection from "./lib/rtl-list.js";
import bus from "./lib/eventbus";
import Modal from "./components/Modal.vue";
import AddonBody from "./components/AddonBody.vue";
import AddonGroupHeader from "./components/AddonGroupHeader.vue";
import CategorySelector from "./components/CategorySelector.vue";
const browserLevelPermissions = ["notifications"];
if (typeof browser !== "undefined") browserLevelPermissions.push("clipboardWrite");
let grantedOptionalPermissions = [];
const updateGrantedPermissions = () =>
  chrome.permissions.getAll(({ permissions }) => {
    grantedOptionalPermissions = permissions.filter((p) => browserLevelPermissions.includes(p));
  });
updateGrantedPermissions();
chrome.permissions.onAdded?.addListener(updateGrantedPermissions);
chrome.permissions.onRemoved?.addListener(updateGrantedPermissions);
let fuse;
const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

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
    if (addonValue.enabled && browserPermissionsRequired.length) {
      pendingPermissions[addonId] = browserPermissionsRequired;
    } else {
      addonsEnabled[addonId] = addonValue.enabled;
    }
    addonSettings[addonId] = Object.assign({}, addonSettings[addonId]);
    delete addonSettings[addonId]._version;
    Object.assign(addonSettings[addonId], addonValue.settings);
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
      Object.keys(pendingPermissions).forEach((addonId) => {
        addonsEnabled[addonId] = granted;
      });
    }
    const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
    await syncSet({
      globalTheme: !!obj.core.lightTheme,
      addonsEnabled,
      addonSettings: minifySettings(addonSettings, prerelease ? null : manifests),
    });
    resolvePromise();
  };
  confirmElem.classList.remove("hidden-button");
  confirmElem.addEventListener("click", handleConfirmClicked, { once: true });
  return resolveOnConfirmPromise;
};

let initialTheme, setGlobalTheme;
(async () => {
  const { theme, setGlobalTheme: sGT } = await globalTheme();
  initialTheme = theme;
  setGlobalTheme = sGT;
})();
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
      smallMode: false,
      theme: initialTheme,
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
      console.log("it runs??");
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
      console.log(this.manifests);
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
          let shouldHideAsEasterEgg = obj.manifest._categories[0] === "easterEgg" && obj.manifest._enabled === false;
          if (addonId === "featured-dangos") {
            // April Fools 2023 addon
            const MARCH_31_TIMESTAMP = 1680264000;
            const APRIL_2_TIMESTAMP = 1680436800;
            const now = new Date().getTime() / 1000;
            // Hide as easter egg if addon is enabled but not functional
            // Also, show even if disabled while it's April Fools
            shouldHideAsEasterEgg = !(now < APRIL_2_TIMESTAMP && now > MARCH_31_TIMESTAMP);
          }
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
          if (obj.group.id === "_iframeSearch") obj.matchesSearch = false;
          else obj.matchesSearch = true;
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
        `${chrome.runtime.getURL("webpages/settings/index.html")}#addon-${
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
      console.log("hi");
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
  },
};
</script>
