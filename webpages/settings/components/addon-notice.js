export default async function ({ template }) {
  const addonNotice = Vue.extend({
    props: ["info", "addon-settings"],
    template,
    computed: {
      shouldShow() {
        // Same logic as addon-setting
        if (!this.info.if) return true;

        if (this.info.if.addonEnabled) {
          const arr = Array.isArray(this.info.if.addonEnabled)
            ? this.info.if.addonEnabled
            : [this.info.if.addonEnabled];
          if (arr.some((addon) => this.$root.manifestsById[addon]._enabled === true)) return true;
        }

        if (this.info.if.settings) {
          const anyMatches = Object.keys(this.info.if.settings).some((settingName) => {
            const arr = Array.isArray(this.info.if.settings[settingName])
              ? this.info.if.settings[settingName]
              : [this.info.if.settings[settingName]];
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
    },
  });
  Vue.component("addon-notice", addonNotice);
}
