<template>
  <div :class="{ 'setting-dropdown': true, open: isOpen }">
    <button type="button" class="large-button clear-button" :disabled="!enabled" @click="toggle" :title="msg('reset')">
      <img src="../../../../images/icons/expand.svg" class="icon-type" />
    </button>
    <ul>
      <li @click="resetToDefault">
        <span v-if="setting.type === 'color'" class="color-preview"
          ><span :style="{ backgroundColor: setting.default }"></span
        ></span>
        <span>{{ msg("default") }}</span>
        <span v-if="setting.type !== 'color'" class="text-preview">{{ setting.default }}</span>
      </li>
      <template v-for="preset in presets">
        <li
          v-if="
            preset.values.hasOwnProperty(setting.id) && setting.type === 'color'
              ? preset.values[setting.id].toLowerCase() != setting.default.toLowerCase()
              : preset.values[setting.id] !== setting.default
          "
          @click="resetToPreset(preset)"
        >
          <span v-if="setting.type === 'color'" class="color-preview"
            ><span :style="{ backgroundColor: preset.values[setting.id] }"></span
          ></span>
          <span>{{ preset.name }}</span>
          <span v-if="setting.type !== 'color'" class="text-preview">{{ preset.values[setting.id] }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>
<script>
import bus from "../lib/eventbus";
export default {
  props: ["enabled", "setting", "presets"],
  data() {
    return {
      isResetDropdown: true,
      isOpen: false,
    };
  },
  mounted() {
    bus.$on("close-reset-dropdowns", (except) => {
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
      this.$parent.addonSettings[this.setting.id] = this.setting.default;
      this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      this.toggle();
    },
    resetToPreset(preset) {
      this.$parent.addonSettings[this.setting.id] = preset.values[this.setting.id];
      this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      this.toggle();
    },
    msg(...params) {
      return this.$root.msg(...params);
    },
  },
};
</script>
