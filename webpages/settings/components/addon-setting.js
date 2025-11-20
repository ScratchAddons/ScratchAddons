export default async function ({ template }) {
  const AddonSetting = Vue.extend({
    props: ["addon", "tableChild", "setting", "addon-settings"],
    template,
    data() {
      return {
        noResetDropdown: ["table", "boolean", "select"].includes(this.setting.type),
      };
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

        const [extMajor, extMinor, _] = window.vue.version.split(".");
        const [addonMajor, addonMinor, __] = this.addon.latestUpdate.version.split(".");
        if (!(extMajor === addonMajor && extMinor === addonMinor)) return false;

        if (this.addon.latestUpdate.newSettings && this.addon.latestUpdate.newSettings.includes(this.setting.id))
          return true;
        else return false;
      },
    },
    methods: {
      settingsName(addon) {
        const name = this.setting.name;
        const regex = /([\\]*)(@|#)([a-zA-Z0-9.\-\/_]*)/g;
        return name.replace(regex, (icon) => {
          if (icon[0] === "\\") {
            return icon.slice(1);
          }
          if (icon[0] === "@") {
            return `<img class="inline-icon" src="../../images/icons/${icon.split("@")[1]}" draggable="false"/>`;
          }
          if (icon[0] === "#") {
            return `<img class="inline-icon" src="../../addons/${addon._addonId}/${
              icon.split("#")[1]
            }" draggable="false"/>`;
          }
        });
      },
      checkValidity() {
        // Needed to get just changed input to enforce it's min, max, and integer rule if the user "manually" sets the input to a value.
        let input = this.$event.target;
        if (!input.validity.valid) this.addonSettings[this.setting.id] = this.setting.default;
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
      shiftTableRow(event, oldPosition) {
        const shift = (event.key === "ArrowDown") - (event.key === "ArrowUp");
        if (event.ctrlKey || event.metaKey || event.altKey || shift === 0) return;
        event.preventDefault();
        const items = this.addonSettings[this.setting.id];
        const newPosition = Math.max(0, Math.min(oldPosition + shift, items.length - 1));
        items.splice(newPosition, 0, items.splice(oldPosition, 1)[0]);
        this.updateSettings();

        // Refocus the handle in its new position
        setTimeout(() => {
          this.$el.querySelector(`.setting-table-row:nth-child(${newPosition + 1}) .handle`).focus();
        }, 0);
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
    },
    events: {
      closePickers(...params) {
        return this.$root.closePickers(...params);
      },
    },
    directives: {
      sortable() {
        const sortable = new window.Sortable(this.el, {
          handle: ".handle",
          animation: 300,
          onUpdate: (event) => {
            const items = this.vm.addonSettings[this.vm.setting.id];
            items.splice(event.newIndex, 0, items.splice(event.oldIndex, 1)[0]);
            this.vm.updateSettings();
          },
          disabled: !this.vm.addon._enabled,
        });
        this.vm.$parent.$on("toggle-addon-request", (state) => {
          sortable.option("disabled", !state);
        });
      },
    },
  });
  Vue.component("addon-setting", AddonSetting);
}
