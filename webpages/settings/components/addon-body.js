const isIframe = window.parent !== window;

export default async function ({ template }) {
  const AddonBody = Vue.extend({
    props: ["addon", "groupId", "groupExpanded", "visible"],
    template,
    data() {
      return {
        expanded: isIframe ? false : this.groupId === "enabled",
      };
    },
    computed: {
      shouldShow() {
        return this.addonMatchesFilters;
      },
      searchInput() {
        return this.$root.searchInput;
      },
      addonSettings() {
        return this.$root.addonSettings;
      },
      addonMatchesFilters() {
        const matchesEasterEgg = this.addon.tags.includes("easterEgg")
        ? this.$root.selectedCategory === "easterEgg" || this.addon._wasEverEnabled
        : true;
        return this.visible && matchesEasterEgg && (this.$root.searchInput === "" ? this.groupExpanded : true);
      },
    },
    methods: {
      devShowAddonIds(event) {
        if (!this.$root.versionName.endsWith("-prerelease") || !event.ctrlKey) return;
        event.stopPropagation();
        Vue.set(this.addon, "_displayedAddonId", this.addon._addonId);
      },
      loadPreset(preset) {
        if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
          for (const property of Object.keys(preset.values)) {
            this.$root.addonSettings[this.addon._addonId][property] = preset.values[property];
          }
          this.$root.updateSettings(this.addon);
          console.log(`Loaded preset ${preset.id} for ${this.addon._addonId}`);
        }
      },
      loadDefaults() {
        if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
          for (const property of this.addon.settings) {
            this.$root.addonSettings[this.addon._addonId][property.id] = property.default;
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
          this.addon._enabled = newState;
          // Do not extend when enabling in popup mode, unless addon has warnings
          this.expanded =
            isIframe && !this.expanded && (this.addon.info || []).every((item) => item.type !== "warning")
              ? false
              : event.shiftKey
              ? false
              : newState;
          chrome.runtime.sendMessage({ changeEnabledState: { addonId: this.addon._addonId, newState } });
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
              document.querySelector(".popup").style.animation = "dropDown 1.6s 1";
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
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
  });
  Vue.component("addon-body", AddonBody);
}
