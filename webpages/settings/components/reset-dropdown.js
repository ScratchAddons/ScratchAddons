export default async function ({ template }) {
  const ResetDropdown = Vue.extend({
    props: ["disabled", "setting", "presets"],
    template,
    methods: {
      resetToDefault() {
        this.$parent.addonSettings[this.setting.id] = this.setting.default;
        this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      },
      resetToPreset(preset) {
        this.$parent.addonSettings[this.setting.id] = preset.values[this.setting.id];
        this.$parent.updateSettings(this.addon, { settingId: this.setting.id });
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
  });
  Vue.component("reset-dropdown", ResetDropdown);
}
