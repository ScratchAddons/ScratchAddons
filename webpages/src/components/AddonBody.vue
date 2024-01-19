<template>
  <div class="addon-body" v-show="shouldShow" :id="'addon-' + addon._addonId">
    <div class="addon-topbar">
      <div class="clickable-area" @click="expanded = !expanded">
        <div class="btn-dropdown">
          <img src="../../../images/icons/expand.svg" alt="v" :class="{ reverted: expanded }" />
        </div>
        <div class="addon-name tooltip">
          <img :src="addonIconSrc" class="icon-type" />
          <span>{{ addon.name }}</span>
          <span v-if="devMode" class="tooltiptext">{{ addon._addonId }}</span>
        </div>
        <addon-tag v-for="tag of addon.tags" :tag="tag"></addon-tag>
      </div>
      <div class="addon-description" v-show="!expanded" dir="auto">{{ addon.description }}</div>
      <div class="addon-check">
        <div
          v-show="expanded && addon._enabled"
          v-if="addon.settings"
          class="addon-buttons"
          title="{{ msg('resetToDefault') }}"
          @click="loadDefaults"
        >
          <img src="../../../images/icons/undo.svg" class="icon-type" />
        </div>
        <div class="switch" :state="addon._enabled ? 'on' : 'off'" @click="toggleAddonRequest"></div>
      </div>
    </div>
    <div class="addon-settings" v-if="everExpanded" v-show="expanded">
      <div class="addon-description-full">{{ addon.description }}</div>
      <div class="addon-message addon-update" v-if="showUpdateNotice">
        <addon-tag tag="new"></addon-tag>
        {{ addon.latestUpdate.temporaryNotice }}
      </div>
      <div id="info" v-for="info of addon.info">
        <div :class="['addon-message', 'addon-' + (info.type || 'info')]">
          <img
            :src="
              '../../../images/icons/' +
              {
                warning: 'warning.svg',
                notice: 'notice.svg',
                info: 'help.svg',
              }[info.type || 'info']
            "
          />{{ info.text }}
        </div>
      </div>
      <div class="addon-credits" v-if="addon.credits">
        <span>{{ msg("creditTo") }}</span>
        <span v-for="credit of addon.credits">
          <span v-if="credit.link">
            <a :href="credit.link" rel="noreferrer noopener" target="_blank">{{ credit.name }}</a>
          </span>
          <span v-else>{{ credit.name }}</span>
          <span v-if="credit.note"> ({{ credit.note }})</span>
        </span>
      </div>
      <div class="addon-license" v-if="addon.libraries && addon.libraries.length">
        <a target="_blank" :href="`./licenses.html?libraries=${addon.libraries.join(',')}`">{{
          msg("viewLicenses")
        }}</a>
      </div>
      <div
        class="preview-column"
        v-if="addon.addonPreview && !isIframe"
        v-bind:class="[!addon._enabled ? 'disabled' : '']"
      >
        <div class="setting-label">{{ msg("preview") }}</div>
        <component
          :is="addon.addonPreview.type"
          :options="addon.addonPreview"
          :settings="addonSettings"
          :hovered-setting-id="hoveredSettingId"
          @areahover="highlightSetting"
        />
      </div>
      <div class="settings-column" v-bind:class="[!addon._enabled ? 'disabled' : '']">
        <addon-setting
          v-for="setting of addon.settings"
          :class="{ 'setting-highlighted': highlightedSettingId === setting.id }"
          :addon="addon"
          :setting="setting"
          :addon-settings="addonSettings"
          @mouseenter="hoveredSettingId = setting.id"
          @mouseleave="hoveredSettingId = null"
        ></addon-setting>
      </div>
      <div class="presets-column" v-if="addon.presets" v-bind:class="[!addon._enabled ? 'disabled' : '']">
        <div class="setting-label">{{ msg("presets") }}</div>
        <div class="addon-setting" v-for="preset of addon.presets">
          <button
            type="preset-button"
            class="large-button"
            :disabled="!addon._enabled"
            @click="loadPreset(preset)"
            :title="preset.description"
          >
            <span class="preset-preview">
              <component
                v-if="addon.presetPreview"
                :is="'preview-' + addon.presetPreview.type"
                :options="addon.presetPreview"
                :setting-data="addon.settings"
                :settings="preset.values"
              />
            </span>
            <span>{{ preset.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.addon-description {
  margin-inline: 15px;
  color: var(--gray-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 0; /* don't include the description
                 when calculating addon-body size */
  flex-grow: 1;
}

.addon-description-full,
.addon-credits {
  width: 100%;
  white-space: normal;
  color: var(--description-text);
}

.addon-credits,
.addon-license {
  margin-top: 4px;
  font-size: 0.9em;
}
.addon-credits a,
.addon-license a {
  color: var(--blue-text);
}

.addon-credits > span {
  margin-inline-end: 0.5rem;
}

.addon-credits > span:not(:first-child):not(:last-child)::after {
  content: ",";
}
.addon-name {
  margin-inline-start: 10px;
  font-weight: 400;
  height: 100%;
  display: flex;
  align-items: center;
}
.addon-name > span:empty {
  display: inline-block;
  width: 150px;
  height: 8px;
  background-color: var(--gray-text);
  border-radius: 3px;
}
.addon-topbar {
  height: 52px;
  padding-inline-end: 10px;
  display: flex;
  align-items: center;
}
.clickable-area {
  padding-inline-start: 10px;
}
.addon-body {
  margin: 10px;
  background: var(--content-background);
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-shadow: var(--content-shadow);
}
.addon-body:target,
.addon-blink {
  /*
      Browsers sometimes ignore :target when the element is appended.
      (This is working as intended per spec.)
      Use CSS class to force animation.
    */
  animation: addonBlink 1s 2 ease-in-out;
}

.addon-buttons {
  display: flex;
  align-items: center;
  padding-block: 8px;
  padding-inline-start: 8px;
  padding-inline-end: 0;
  border-radius: 4px;
  margin-inline-end: 8px;
  cursor: pointer;
  background: none;
  border: none;
  transition: 0.2s ease;
}
.addon-buttons:hover:not([disabled]),
.addon-split-button.open .addon-split-button-dropdown,
.addon-split-button.open:hover .addon-split-button-dropdown:not(:hover) {
  background: var(--hover-highlight);
}
.addon-split-button:hover:not([disabled]) .addon-split-button-button:not(:hover),
.addon-split-button:hover:not([disabled]) .addon-split-button-dropdown:not(:hover),
.addon-split-button.open .addon-split-button-button {
  background: var(--hover-highlight-reduced);
}
[disabled] {
  cursor: initial !important;
}
.addon-split-button-button {
  margin: 0;
  border-radius: 4px 0 0 4px;
}
[dir="rtl"] .addon-split-button-button {
  border-radius: 0 4px 4px 0;
}
.addon-split-button-dropdown {
  margin: 0;
  border-radius: 0 4px 4px 0;
}
[dir="rtl"] .addon-split-button-dropdown {
  border-radius: 4px 0 0 4px;
}
.addon-split-button.open .addon-split-button-button,
.addon-split-button.open .addon-split-button-dropdown {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.btn-dropdown {
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: 0.2s ease;
}
.clickable-area:hover .btn-dropdown {
  background: var(--hover-highlight);
}

.btn-dropdown img {
  height: 24px;
  width: 24px;
  filter: var(--content-icon-filter);
}

.clickable-area {
  cursor: pointer;
  display: flex;
  align-self: stretch;
  align-items: center;
}
.clickable-area .tooltip {
  cursor: pointer;
}
.iframe .clickable-area {
  flex-grow: 1;
}
.addon-message {
  padding: 8px;
  border: 2px solid;
  border-radius: 5px;
  font-weight: 600;
  margin: 10px 0;
  display: flex;
  align-items: center;
}
.addon-notice {
  border-color: var(--notice-border);
  background-color: var(--notice-background);
  color: var(--notice-text);
}
.addon-warning {
  border-color: var(--warning-border);
  background-color: var(--warning-background);
  color: var(--warning-text);
}
.addon-info {
  border-color: var(--info-border);
  background-color: var(--navigation-background);
  color: var(--description-text);
  font-weight: normal;
}
.addon-update {
  border-color: var(--update-border);
  background-color: var(--update-background);
  color: var(--update-text);
}
.addon-update .badge {
  margin: -3px;
  margin-inline-end: 10px;
}
.addon-message img {
  height: 15px;
  width: 15px;
  margin-inline-end: 10px;
}
.addon-notice img {
  filter: var(--notice-icon-filter);
}
.addon-warning img {
  filter: var(--warning-icon-filter);
}
.addon-info img {
  filter: var(--description-icon-filter);
}
.addon-settings {
  padding-top: 5px;
  padding-inline: 20px;
}
.addon-setting::after {
  content: "";
  position: absolute;
  top: -7px;
  bottom: -7px;
  left: -7px;
  right: -7px;
  border: 1px solid transparent;
  border-radius: 4px;
  pointer-events: none;
  transition: 0.2s ease;
}
.setting-highlighted::after {
  border-color: var(--orange);
}

.presets-column,
.settings-column {
  width: 100%;
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
}
.preview-column {
  margin: 10px 0;
  padding-left: 10px;
}
.presets-column {
  align-items: center;
}
.presets-column > .setting-label {
  margin-inline-start: 10px;
}
.addon-preset {
  margin-inline-end: 30px;
}
.preset-preview {
  display: inline-flex;
}

.addon-check {
  margin-inline-start: auto;
  padding: 5px;
  display: flex;
  align-items: center;
}

.switch {
  display: block;
  background: var(--button-background);
  width: 40px;
  height: 20px;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid var(--switch-border);
  box-sizing: border-box;
}
.switch::before {
  content: "";
  position: absolute;
  display: block;
  width: 10px;
  height: 10px;
  background: var(--switch-inner-background);
  border-radius: 5px;
  top: 4px;
  left: 4px;
  transition: all 0.25s ease;
}

.switch[state="on"] {
  background: var(--brand-orange);
  border-color: var(--brand-orange);
}
.switch[state="on"]::before {
  background: var(--white-text);
  left: 24px;
}

[dir="rtl"] .switch::before {
  left: 24px;
}
[dir="rtl"] .switch[state="on"]::before {
  left: 4px;
}
</style>
<script>
import AddonSetting from "./AddonSetting.vue";
import AddonTag from "./AddonTag.vue";
import EditorDarkMode from "./previews/EditorDarkMode.vue";
import PreviewPalette from "./previews/PreviewPalette.vue";
import bus from "../lib/eventbus.js";
const isIframe = window.parent !== window;

export default {
  components: { AddonTag, AddonSetting, EditorDarkMode, PreviewPalette },

  props: ["addon", "groupId", "groupExpanded", "visible"],
  data() {
    return {
      isIframe: isIframe,
      expanded: this.getDefaultExpanded(),
      everExpanded: this.getDefaultExpanded(),
      hoveredSettingId: null,
      highlightedSettingId: null,
    };
  },
  computed: {
    shouldShow() {
      return this.visible && (this.$root.searchInput === "" ? this.groupExpanded : true);
    },
    addonIconSrc() {
      const map = {
        editor: "puzzle",
        community: "web",
        theme: "brush",
        easterEgg: "egg-easter",
        popup: "popup",
      };
      return `../../../images/icons/${map[this.addon._icon]}.svg`;
    },
    addonSettings() {
      return this.$root.addonSettings[this.addon._addonId];
    },
    devMode() {
      return this.$root.devMode;
    },
    showUpdateNotice() {
      if (!this.addon.latestUpdate || !this.addon.latestUpdate.temporaryNotice) return false;
      const [extMajor, extMinor, _] = this.$root.version.split(".");
      const [addonMajor, addonMinor, __] = this.addon.latestUpdate.version.split(".");
      return extMajor === addonMajor && extMinor === addonMinor;
    },
  },
  methods: {
    getDefaultExpanded() {
      return isIframe ? false : this.groupId === "enabled";
    },
    loadPreset(preset) {
      if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
        for (const property of Object.keys(preset.values)) {
          this.addonSettings[property] = preset.values[property];
        }
        this.$root.updateSettings(this.addon);
        console.log(`Loaded preset ${preset.id} for ${this.addon._addonId}`);
      }
    },
    loadDefaults() {
      if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
        for (const property of this.addon.settings) {
          // Clone necessary for tables
          this.addonSettings[property.id] = JSON.parse(JSON.stringify(property.default));
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
        this.addon._wasEverEnabled = this.addon._enabled || newState;
        this.addon._enabled = newState;
        // Do not extend when enabling in popup mode, unless addon has warnings
        this.expanded =
          isIframe && !this.expanded && (this.addon.info || []).every((item) => item.type !== "warning")
            ? false
            : event.shiftKey
              ? false
              : newState;
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: this.addon._addonId, newState } });
        bus.$emit(`toggle-addon-request-${this.addon.id}`, newState);
      };

      const requiredPermissions = (this.addon.permissions || []).filter((value) =>
        this.$root.browserLevelPermissions.includes(value)
      );
      if (!this.addon._enabled && this.addon.tags.includes("danger")) {
        const confirmation = confirm(chrome.i18n.getMessage("dangerWarning", [this.addon.name]));
        if (!confirmation) return;
      }
      if (!this.addon._enabled && requiredPermissions.length) {
        const result = requiredPermissions.every((p) => this.$root.grantedOptionalPermissions.includes(p));
        if (result === false) {
          if (isIframe) {
            this.$root.addonToEnable = this.addon;
            document.querySelector(".popup").style.animation = "dropDown 0.35s 1";
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
    highlightSetting(id) {
      this.highlightedSettingId = id;
    },
    msg(...params) {
      return this.$root.msg(...params);
    },
  },
  watch: {
    groupId(newValue) {
      // Happens when going from "example" addon to real addon
      this.expanded = this.getDefaultExpanded();
    },
    searchInput(newValue) {
      if (newValue === "") this.expanded = this.getDefaultExpanded();
      else this.expanded = false;
    },
    expanded(newValue) {
      if (newValue === true) this.everExpanded = true;
    },
  },
  mounted() {
    const onHashChange = () => {
      if (location.hash.replace(/^#addon-/, "") === this.addon._addonId) {
        this.expanded = true;
      }
    };
    window.addEventListener("hashchange", onHashChange, { capture: false });
    setTimeout(onHashChange, 0);
  },
};
</script>
