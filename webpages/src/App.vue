<template>
  <div class="navbar">
    <img :src="switchPath" class="toggle" @click="sidebarToggle()" v-cloak v-show="smallMode" alt="Logo" />
    <img src="../../images/icon-transparent.svg" class="logo" alt="Logo" />
    <h1 v-cloak>{{ msg("settings") }} <span class="vue3">Vue 3</span></h1>
    <div @click="setTheme(!theme)" class="header-button">
      <img v-cloak class="theme-switch" :src="themePath" />
    </div>
  </div>
  <div class="main">
    <div
      class="categories-block"
      v-click-outside="closesidebar"
      v-show="categoryOpen && !isIframe"
      :class="{ smallMode: smallMode === true }"
    >
      <CategorySelector v-for="category of categories" :category="category"></CategorySelector>

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
      <a v-cloak class="category category-small" href="https://scratchaddons.com/translate" target="_blank">
        <img src="../../images/icons/translate.svg" />
        <span>{{ msg("translate") }} <img src="../../images/icons/popout.svg" /></span>
      </a>
      <a v-cloak class="category category-small" :href="sidebarUrls.feedback" target="_blank">
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
          <AddonGroupHeader
            v-if="addon.headerAbove"
            :group="addon.group"
            :shown-count="groupShownCount(addon.group)"
            :margin-above="groupMarginAbove(addon.group)"
          ></AddonGroupHeader>
          <AddonBody
            :visible="addon.matchesSearch && addon.matchesCategory"
            :addon="addon.manifest"
            :group-id="addon.group.id"
            :group-expanded="addon.group.expanded"
          ></AddonBody>
        </template>
      </div>
    </div>
  </div>

  <modal class="more-settings" v-model="moreSettingsOpen" :title="msg('moreSettings')" v-cloak>
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
          href="./licenses.html?libraries=icu-message-formatter,vue3,vite,vue-accessible-color-picker,comlink,Sora,fuse,idb,sortable,tiny-emitter"
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
import App from "./App.js";
export default App;
</script>
