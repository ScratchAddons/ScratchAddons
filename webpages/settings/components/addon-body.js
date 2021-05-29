const isIframe = window.parent !== window;

export default async function ({ template }) {
  const AddonBody = Vue.extend({
    props: ["addon", "groupId", "groupExpanded"],
    template,
    data() {
      return {
        expanded: isIframe ? false : this.groupId === "enabled",
      };
    },
    computed: {
      shouldShow() {
        const matches =
          this.$root.selectedCategory === "all" || this.addon._categories.includes(this.$root.selectedCategory);
        if (matches) return this.addonMatchesFilters;
        else return false;
      },
      searchInput() {
        return this.$root.searchInput;
      },
      addonSettings() {
        return this.$root.addonSettings;
      },
      addonMatchesFilters() {
        if (this.groupId !== "search" && this.searchInput !== "") return false;
        if (!this.addon._wasEverEnabled) this.addon._wasEverEnabled = this.addon._enabled;

        const search = this.searchInput.toLowerCase();

        const matchesSearch =
          this.searchInput === "" ||
          this.addon.name.toLowerCase().includes(search) ||
          this.addon._addonId.toLowerCase().includes(search) ||
          this.addon.description.toLowerCase().includes(search) ||
          (this.addon.credits &&
            this.addon.credits.map((obj) => obj.name.toLowerCase()).some((author) => author.includes(search)));
        // Show disabled easter egg addons only if category is easterEgg
        const matchesEasterEgg = this.addon.tags.includes("easterEgg")
          ? this.$root.selectedCategory === "easterEgg" || this.addon._wasEverEnabled
          : true;

        return matchesSearch && matchesEasterEgg;
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
