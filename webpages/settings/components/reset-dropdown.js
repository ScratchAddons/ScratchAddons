export default {
  props: ["addon", "setting", "label", "defaultLabel"],
  data() {
    return {
      isResetDropdown: true,
      isOpen: false,
    };
  },
  ready() {
    this.$settingsContext.$on("close-reset-dropdowns", (except) => {
      if (this.isOpen && this !== except) {
        this.isOpen = false;
      }
    });
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
      this.$settingsContext.closePickers({ isTrusted: true }, null, {
        callCloseDropdowns: false,
      });
      this.$settingsContext.closeResetDropdowns({ isTrusted: true }, this); // close other dropdowns
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
  },
};
