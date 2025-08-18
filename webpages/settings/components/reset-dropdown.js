export default async function ({ template }) {
  const ResetDropdown = Vue.extend({
    props: ["enabled", "setting", "presets"],
    template,
    data() {
      return {
        isResetDropdown: true,
        isOpen: false,
      };
    },
    ready() {
      this.$root.$on("close-dropdowns", (except) => {
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
        this.$root.closeDropdowns({ isTrusted: true }, this); // close other dropdowns
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
  });
  Vue.component("reset-dropdown", ResetDropdown);
}
