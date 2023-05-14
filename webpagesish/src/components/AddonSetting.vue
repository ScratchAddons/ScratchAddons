<template>
  <div
    v-show="show"
    class="addon-setting"
    :class="{
      'boolean-setting': setting.type === 'boolean',
      'number-setting': setting.type === 'integer' || setting.type === 'positive_integer',
    }"
  >
    <div class="setting-label-container">
      <div class="setting-label" v-html="settingsName(addon)"></div>
      <addon-tag v-if="isNewOption" tag="new"></addon-tag>
    </div>
    <template v-if="noResetDropdown">
      <div v-if="setting.type === 'table'" class="setting-table">
        <div class="setting-table-list" v-sortable="{update, enabled: addon._enabled}">
          <div class="setting-table-row" v-for="(i, row) of addonSettings[setting.id]">
            <div class="setting-table-options">
              <button :disabled="!addon._enabled" class="addon-buttons" @click="deleteTableRow(i)">
                <img class="icon-type" src="../../../images/icons/close.svg" />
              </button>
              <button :disabled="!addon._enabled" class="addon-buttons handle">
                <img class="icon-type" src="../../../images/icons/drag.svg" />
              </button>
            </div>
            <div class="setting-table-row-settings">
              <addon-setting
                v-for="(id, val) of row"
                :addon="addon"
                :table-child="true"
                :setting="getTableSetting(id)"
                :addon-settings="row"
              ></addon-setting>
            </div>
          </div>
        </div>
        <div class="addon-split-button setting-table-dropdown" :class="{ open: rowDropdownOpen }">
          <button :disabled="!addon._enabled" class="addon-buttons addon-split-button-button" @click="addTableRow()">
            <img class="icon-type" src="../../../images/icons/plus.svg" />
          </button>
          <div v-click-outside="closeResetDropdowns">
            <button
              :disabled="!addon._enabled"
              class="addon-buttons addon-split-button-dropdown"
              @click="toggleRowDropdown"
            >
              <img class="icon-type" src="../../../images/icons/expand.svg" />
            </button>
            <ul>
              <li v-for="preset of setting.presets" @click="addTableRow(preset.values)">{{ preset.name }}</li>
            </ul>
          </div>
        </div>
      </div>
      <input
        v-if="setting.type === 'boolean'"
        type="checkbox"
        class="setting-input check"
        v-model="addonSettings[setting.id]"
        @change="updateSettings()"
        :disabled="!addon._enabled"
      />
      <div v-if="setting.type === 'select'" class="filter-options">
        <div
          class="filter-option"
          v-for="option of setting.potentialValues"
          :class="{ sel: addonSettings[setting.id] === option.id, disabled: !addon._enabled }"
          @click="updateOption(option.id)"
        >
          {{ option.name }}
        </div>
      </div>
    </template>
    <div v-else class="setting-input-container" :class="{ 'full-radius': tableChild }">
      <template v-if="setting.type === 'positive_integer'">
        <input
          type="number"
          class="setting-input number"
          v-model="addonSettings[setting.id]"
          @change="checkValidity($event) || updateSettings()"
          :disabled="!addon._enabled"
          min="0"
          number
        />
      </template>
      <template v-if="setting.type === 'integer'">
        <input
          type="number"
          class="setting-input number"
          v-model="addonSettings[setting.id]"
          @change="checkValidity($event) || updateSettings()"
          :disabled="!addon._enabled"
          :min="setting.min"
          :max="setting.max"
          number
        />
      </template>
      <template v-if="setting.type === 'string' || setting.type === 'untranslated'"
        ><input
          type="text"
          class="setting-input string"
          v-model="addonSettings[setting.id]"
          @change="checkValidity($event) || updateSettings()"
          :disabled="!addon._enabled"
          :placeholder="setting.default"
          :maxlength="setting.max || 100"
          :minlength="setting.min || 0"
          :required="!!setting.min"
        />
      </template>
      <template v-if="setting.type === 'key'"
        ><input
          type="text"
          class="setting-input"
          v-model="addonSettings[setting.id]"
          @input="updateSettings"
          @keydown="keySettingKeyDown"
          @keyup="keySettingKeyUp"
          :disabled="!addon._enabled"
          :placeholder="setting.default"
          maxlength="100"
          spellcheck="false"
      /></template>
      <template v-if="setting.type === 'color'">
        <picker
          :value="addonSettings[setting.id]"
        
          :setting="setting"
          :addon="addon"
          :no_alpha="!setting.allowTransparency"
          v-click-outside="closePickers"
        ></picker
      ></template>
      <template v-if="showResetDropdown"
        ><reset-dropdown
          :setting="setting"
          :enabled="addon._enabled"
          :presets="addon.presets"
          v-click-outside="closeResetDropdowns"
        ></reset-dropdown
      ></template>
      <template v-if="!tableChild && !showResetDropdown"
        ><button
          type="button"
          class="large-button clear-button"
          :disabled="!addon._enabled"
          :title="msg('reset')"
          @click="updateOption(setting.default || '')"
        >
          <img src="../../../images/icons/undo.svg" class="icon-type" /></button
      ></template>
    </div>
  </div>
</template>

<style>
.addon-setting {
  margin: 10px;
  margin-inline-end: 20px;
  min-height: 32px;
  display: flex;
  align-items: center;
  position: relative;
}
.setting-input {
  color: var(--content-text);
  background: var(--input-background);
  border: 1px solid var(--control-border);
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  margin-left: auto;
  border-radius: 4px 0 0 4px;
  transition: 0.2s ease;
  transition-property: box-shadow, border;
}
[dir="rtl"] .setting-input {
  border-radius: 0 4px 4px 0;
}
.full-radius .setting-input {
  border-radius: 4px;
}
.setting-input:focus-visible {
  outline: none;
  border-color: var(--orange);
  box-shadow: var(--input-focus-shadow);
}

.setting-input.check {
  appearance: none;
  display: block;
  width: 40px;
  height: 20px;
  background-color: var(--switch-background);
  border: none;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.25s ease;
}

.setting-input.check::before {
  content: "";
  position: absolute;
  top: 5px;
  left: 5px;
  display: block;
  width: 10px;
  height: 10px;
  background-color: var(--switch-inner-background);
  border-radius: 5px;
  transition: all 0.25s ease;
}
[dir="rtl"] .setting-input.check::before {
  left: 25px;
}

.setting-input.check:checked {
  background-color: var(--blue);
}

.setting-input.check:checked::before {
  background-color: var(--white-text);
  left: 25px;
}
[dir="rtl"] .setting-input.check:checked::before {
  left: 5px;
}

.setting-input.number {
  max-width: 150px;
  border-radius: 16px 0 0 16px;
}
[dir="rtl"] .setting-input.number {
  border-radius: 0 16px 16px 0;
}
.full-radius .setting-input.number {
  border-radius: 16px;
}

.setting-input-container {
  display: flex;
  align-items: center;
}

.setting-label-container {
  display: flex;
  align-items: center;
  width: 200px;
  margin-inline-end: 10px;
}

.setting-label {
  text-transform: uppercase;
  color: var(--label-text);
  font-weight: 600;
  font-size: 12px;
}

.setting-dropdown,
.setting-table-dropdown {
  position: relative;
}
.setting-dropdown.open .clear-button {
  border-bottom-right-radius: 0;
  background: var(--button-hover-background);
}
[dir="rtl"] .setting-dropdown.open .clear-button {
  border-bottom-left-radius: 0;
}
.iframe .setting-dropdown.open .clear-button {
  border-bottom-right-radius: 4px;
}
.iframe[dir="rtl"] .setting-dropdown.open .clear-button {
  border-bottom-left-radius: 4px;
}
.setting-dropdown ul,
.setting-table-dropdown ul {
  position: absolute;
  top: calc(100% - 1px);
  right: 0;
  margin: 0;
  padding: 6px 0;
  display: none;
  z-index: 3;
  border-radius: 4px;
  border-top-right-radius: 0;
  background: var(--button-background);
  color: var(--content-text);
  border: 1px solid var(--control-border);
}
.iframe .setting-dropdown ul {
  right: auto;
  left: -100px;
  border-top-right-radius: 4px;
}
[dir="rtl"] .setting-dropdown ul {
  right: auto;
  left: 0;
  border-top-right-radius: 4px;
  border-top-left-radius: 0;
}
.iframe[dir="rtl"] .setting-dropdown ul {
  left: auto;
  right: -100px;
  border-top-left-radius: 4px;
}
.setting-dropdown.open ul,
.setting-table-dropdown.open ul {
  display: block;
}
.setting-dropdown li,
.setting-table-dropdown li {
  padding: 6px 12px;
  list-style: none;
  white-space: nowrap;
  text-align: start;
  transition: 0.2s ease;
  user-select: none;
}
.setting-dropdown li:hover,
.setting-table-dropdown li:hover {
  background: var(--button-hover-background);
}
.setting-dropdown li > * {
  vertical-align: middle;
}
.setting-dropdown .color-preview {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-inline-end: 8px;
  border-radius: 5px;
  background: linear-gradient(45deg, #777 25%, transparent 25%), linear-gradient(-45deg, #777 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #777 75%), linear-gradient(-45deg, transparent 75%, #777 75%);
  background-color: white;
  background-size: 6px 6px;
  background-position: 0 0, 0 3px, 3px -3px, -3px 0px;
}
.setting-dropdown .color-preview span {
  display: inline-block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid var(--control-border);
}
.setting-dropdown .text-preview {
  margin-left: 12px;
  color: var(--label-text);
  font-weight: 600;
}

.setting-table {
  display: flex;
  flex-direction: column;
}
.setting-table-list {
  display: flex;
  flex-direction: column;
}
.setting-table-row {
  display: flex;
  margin: 10px 0px;
}
.setting-table-row-settings {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-bottom: 10px;
  background: var(--navigation-background);
  border-radius: 10px;
}
.setting-table-row-settings .addon-setting {
  margin-inline-end: 10px;
  margin-bottom: 0;
  flex-wrap: wrap;
}
.setting-table-options {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.setting-table-dropdown {
  align-self: flex-start;
  display: flex;
}
.setting-table-dropdown ul {
  right: auto;
  left: 0;
  border-radius: 4px;
  border-top-left-radius: 0;
}
[dir="rtl"] .setting-table-dropdown ul {
  left: auto;
  right: 0;
  border-top-left-radius: 4px;
  border-top-right-radius: 0;
}
</style>
<script>
import Picker from "./Picker.vue";
import ResetDropdown from "./ResetDropdown.vue";
import Sortable from 'sortablejs';
import bus from '../lib/eventbus'
export default {
  components: { Picker, ResetDropdown },

  props: ["addon", "tableChild", "setting", "addon-settings"],
  data() {
        console.log(this.setting, this.addon);

    return {
      rowDropdownOpen: false,
      noResetDropdown: ["table", "boolean", "select"].includes(this.setting?.type),
    };
  },
  mounted() {

    bus.$on("close-reset-dropdowns", (except) => {
      if (this.rowDropdownOpen && this !== except) {
        this.rowDropdownOpen = false;
      }
    });
  },
  computed: {
    show() {
      if (!this.setting.if) return true;

      if (this.setting.if.addonEnabled) {
        const arr = Array.isArray(this.setting.if.addonEnabled)
          ? this.setting.if.addonEnabled
          : [this.setting.if.addonEnabled];
        if (arr.some((addon) => this.$root.manifestsById[addon]._enabled === true)) return true;
      }

      if (this.setting.if.settings) {
        const anyMatches = Object.keys(this.setting.if.settings).some((settingName) => {
          const arr = Array.isArray(this.setting.if.settings[settingName])
            ? this.setting.if.settings[settingName]
            : [this.setting.if.settings[settingName]];
          return arr.some(
            (possibleValue) =>
              this.addonSettings[settingName] === possibleValue ||
              this.$parent?.addonSettings?.[settingName] === possibleValue
          );
        });
        if (anyMatches === true) return true;
      }

      return false;
    },
    showResetDropdown() {
      return (
        !this.tableChild &&
        this.addon.presets &&
        this.addon.presets.some(
          (preset) =>
            Object.prototype.hasOwnProperty.call(preset.values, this.setting.id) &&
            (this.setting.type === "color"
              ? preset.values[this.setting.id].toLowerCase() !== this.setting.default.toLowerCase()
              : preset.values[this.setting.id] !== this.setting.default)
        )
      );
    },
    isNewOption() {
      if (!this.addon.latestUpdate) return false;

      const [extMajor, extMinor, _] = this.$root.version.split(".");
      const [addonMajor, addonMinor, __] = this.addon.latestUpdate.version.split(".");
      if (!(extMajor === addonMajor && extMinor === addonMinor)) return false;

      if (this.addon.latestUpdate.newSettings && this.addon.latestUpdate.newSettings.includes(this.setting.id))
        return true;
      else return false;
    },
  },
  methods: {
    update(event) { 
      
            let list = this.addonSettings[this.setting.id];
            list.splice(event.newIndex, 0, list.splice(event.oldIndex, 1)[0]);
            this.updateSettings();
          
    },
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
    checkValidity(event) {
      // Needed to get just changed input to enforce it's min, max, and integer rule if the user "manually" sets the input to a value.
      let input = event.target;
      this.addonSettings[this.setting.id] = input.validity.valid ? input.value : this.setting.default;
    },
    keySettingKeyDown(e) {
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
    },
    keySettingKeyUp(e) {
      // Ctrl by itself isn't a hotkey
      if (e.target.value === "Ctrl") e.target.value = "";
      this.updateOption(e.target.value);
    },
    getTableSetting(id) {
      return this.setting.row.find((setting) => setting.id === id);
    },
    deleteTableRow(i) {
      this.addonSettings[this.setting.id].splice(i, 1);
      this.updateSettings();
    },
    addTableRow(items = {}) {
      const settings = Object.assign(
        {},
        this.setting.row.reduce((acc, cur) => {
          acc[cur.id] = cur.default;
          return acc;
        }, {}),
        items
      );
      this.addonSettings[this.setting.id].push(settings);
      this.updateSettings();
      if (this.rowDropdownOpen) this.toggleRowDropdown();
    },
    toggleRowDropdown() {
      this.rowDropdownOpen = !this.rowDropdownOpen;
      this.$root.closePickers({ isTrusted: true }, null, {
        callCloseDropdowns: false,
      });
      this.$root.closeResetDropdowns({ isTrusted: true }, this); // close other dropdowns
    },
    msg(...params) {
      return this.$root.msg(...params);
    },
    updateSettings(...params) {
      if (!params[0]) params[0] = this.addon;
      this.$root.updateSettings(...params);
    },
    updateOption(newValue) {
      this.addonSettings[this.setting.id] = newValue;
      this.updateSettings();
    },

    closePickers(...params) {
      console.log('hi');
      return this.$root.closePickers(...params);
    },
    closeResetDropdowns(...params) {
      return this.$root.closeResetDropdowns(...params);
    },
  },
  directives: {
    sortable: {
      mounted: (el, binding,vnode) => {
        console.log(binding.instance);
        const sortable = new Sortable(el, {
          handle: ".handle",
          animation: 300,
          onUpdate: binding.value.update,
          disabled: !binding.value.enabled,
        });
        /*vnode.ctx.$parent.$on("toggle-addon-request", (state) => {
          sortable.option("disabled", !state);
        });*/
      
      },
    },
  },
};
</script>
