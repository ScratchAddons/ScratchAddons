export default async function ({ template }) {
  const promisify =
    (callbackFn) =>
    (...args) =>
      new Promise((resolve) => callbackFn(...args, resolve));
  const syncGet = promisify(chrome.storage.sync.get.bind(chrome.storage.sync));
  const { addonsEnabled } = await syncGet(["addonsEnabled"]);
  const AddonSetting = Vue.extend({
    props: ["addon", "setting", "addon-settings", "addonsEnabled"],
    template,
    data() {
      return {
        show: this.calculateShow(),
      };
    },
    ready() {
      this.$root.$on("update-shown-settings", (info) => {
        addonsEnabled[info.changeEnabledState.addonId] = info.changeEnabledState.newState;
        this.show = this.calculateShow();
      });
    },
    methods: {
      calculateShow() {
        if (!this.setting.if) return true;
        const settings=this.addonSettings[this.addon._addonId]

        for (const addon in this.setting.if.addons || {}) {
          if (Object.hasOwnProperty.call(this.setting.if.addons, addon)) {
            console.log({_addonId:this.addon._addonId, addon,value:addonsEnabled[addon],wanted:this.setting.if.addons[addon]})
            if (addonsEnabled[addon] !== this.setting.if.addons[addon]) return false;
          }
        }

        for (const setting in this.setting.if.settings || {}) {
          if (Object.hasOwnProperty.call(this.setting.if.settings, setting)) {
            /** `settingValue` can be a single value or an array of values. If it's an array, only 1 must match. */
            const settingValue = this.setting.if.settings[setting];
            if (settingValue instanceof Array) {
              console.log({settingValue, setting, actualsettingValue:settings[setting]});
              for (const possibleValue of settingValue) {
                if (settings[setting] === possibleValue) return true;
              }
            }else if (settings[setting] !== settingValue) return false;
          }
        }
        return true;
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

      showResetDropdown() {
        return (
          this.addon.presets &&
          this.addon.presets.some(
            (preset) => this.setting.id in preset.values && preset.values[this.setting.id] !== this.setting.default
          )
        );
      },
      checkValidity() {
        // Needed to get just changed input to enforce it's min, max, and integer rule if the user "manually" sets the input to a value.
        let input = document.querySelector(
          `input[data-addon-id='${this.addon._addonId}'][data-setting-id='${this.setting.id}']`
        );
        this.addonSettings[this.addon._addonId][this.setting.id] = input.validity.valid
          ? input.value
          : this.setting.default;
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
      msg(...params) {
        return this.$root.msg(...params);
      },
      updateSettings(...params) {
        if (!params[0]) params[0] = this.addon;
        this.$root.updateSettings(...params);
      },
      updateOption(newValue) {
        this.addonSettings[this.addon._addonId][this.setting.id] = newValue;
        this.updateSettings();
      },
    },
    events: {
      closePickers(...params) {
        return this.$root.closePickers(...params);
      },
      closeResetDropdowns(...params) {
        return this.$root.closeResetDropdowns(...params);
      },
    },
  });
  Vue.component("addon-setting", AddonSetting);
}
