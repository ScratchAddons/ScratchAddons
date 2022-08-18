const isIframe = window.parent !== window;

export default async function ({ template }) {
  const AddonBody = Vue.extend({
    props: ["addon", "groupId", "groupExpanded", "visible"],
    template,
    data() {
      return {
        isIframe: isIframe,
        expanded: false,
        everExpanded: false,
        hoveredSettingId: null,
        highlightedSettingId: null,
        popperInstance: {},
      };
    },
    computed: {
      shouldShow() {
        return this.visible && (this.$root.searchInput === "" ? this.groupExpanded : true);
      },
      addonIconSrc() {
        const map = {
          editor: "puzzle",
          community: "web",
          theme: "brush",
          easterEgg: "egg-easter",
          popup: "popup",
        };
        return `../../images/icons/${map[this.addon._icon]}.svg`;
      },
      addonSettings() {
        return this.$root.addonSettings[this.addon._addonId];
      },
      showUpdateNotice() {
        if (!this.addon.latestUpdate || !this.addon.latestUpdate.temporaryNotice) return false;
        const [extMajor, extMinor, _] = this.$root.version.split(".");
        const [addonMajor, addonMinor, __] = this.addon.latestUpdate.version.split(".");
        return extMajor === addonMajor && extMinor === addonMinor;
      },
    },
    methods: {
      getDefaultExpanded() {
        return isIframe ? false : this.groupId === "enabled";
      },
      devShowAddonIds(event) {
        if (!this.$root.versionName.endsWith("-prerelease") || !event.ctrlKey) return;
        event.stopPropagation();
        Vue.set(this.addon, "_displayedAddonId", this.addon._addonId);
      },
      loadPreset(preset) {
        if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
          for (const property of Object.keys(preset.values)) {
            this.addonSettings[property] = preset.values[property];
          }
          this.$root.updateSettings(this.addon);
          console.log(`Loaded preset ${preset.id} for ${this.addon._addonId}`);
        }
      },
      loadDefaults() {
        if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
          for (const property of this.addon.settings) {
            // Clone necessary for tables
            this.addonSettings[property.id] = JSON.parse(JSON.stringify(property.default));
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
          this.addon._wasEverEnabled = this.addon._enabled || newState;
          this.addon._enabled = newState;
          // Do not extend when enabling in popup mode, unless addon has warnings
          this.expanded = false;
          chrome.runtime.sendMessage({ changeEnabledState: { addonId: this.addon._addonId, newState } });
          this.$emit("toggle-addon-request", newState);
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
      highlightSetting(id) {
        this.highlightedSettingId = id;
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
      toggleSettings(value) {
        function enableListeners(modifiers, value) {
          const modifier = modifiers.find((x) => x.name === "eventListeners");
          if (!modifier) return [...modifiers, { name: "eventListeners", enabled: value }];
          modifier.enabled = value;
          return modifiers;
        }

        this.expanded = value;
        if (this.expanded) {
          this.popperInstance.setOptions((options) => ({
            modifiers: enableListeners(options.modifiers, true),
          }));
        } else {
          this.popperInstance.setOptions((options) => ({
            modifiers: enableListeners(options.modifiers, false),
          }));
        }
        this.popperInstance.update();
      },
    },
    events: {
      closeSettings() {
        if (!this.expanded) return;
        this.toggleSettings(false);
      },
    },
    watch: {
      groupId(newValue) {
        // Happens when going from "example" addon to real addon
        //this.expanded = this.getDefaultExpanded();
      },
      searchInput(newValue) {
        if (newValue === "") this.expanded = this.getDefaultExpanded();
        else this.expanded = false;
      },
      expanded(newValue) {
        if (newValue === true) this.everExpanded = true;
      },
    },
    ready() {
      const onHashChange = () => {
        if (location.hash.replace(/^#addon-/, "") === this.addon._addonId) {
          this.expanded = true;
        }
      };
      window.addEventListener("hashchange", onHashChange, { capture: false });
      setTimeout(onHashChange, 0);
      const expand = this.$els.expand;
      const tooltip = this.$els.tooltip;
      this.popperInstance = Popper.createPopper(expand, tooltip, {
        placement: "right",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [-50, 250],
            },
          },
          {
            name: "flip",
            options: {
              fallbackPlacements: ["left"],
            },
          },
        ],
      });
    },
  });
  Vue.component("addon-body", AddonBody);
}
