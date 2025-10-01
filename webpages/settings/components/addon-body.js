import downloadBlob from "../../../libraries/common/cs/download-blob.js";
const isIframe = window.parent !== window;

export default async function ({ template }) {
  const AddonBody = Vue.extend({
    props: ["addon", "groupId", "groupExpanded", "visible"],
    template,
    data() {
      return {
        isIframe: isIframe,
        expanded: this.getDefaultExpanded(),
        everExpanded: this.getDefaultExpanded(),
        hoveredSettingId: null,
        highlightedSettingId: null,
        isDropdownOpen: false,
      };
    },
    computed: {
      shouldShow() {
        return this.visible && (this.$root.searchInput === "" ? this.groupExpanded : true);
      },
      addonIconSrc() {
        const map = {
          editor: "puzzle",
          player: "player",
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
      devMode() {
        return this.$root.devMode;
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
      loadPreset(preset) {
        if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
          for (const property of Object.keys(preset.values)) {
            this.addonSettings[property] = preset.values[property];
          }
          this.$root.updateSettings(this.addon);
          console.log(`Loaded preset ${preset.id} for ${this.addon._addonId}`);
        }
      },
      importPreset() {
        const inputElem = Object.assign(document.createElement("input"), {
          hidden: true,
          type: "file",
          accept: "application/json",
        });
        inputElem.addEventListener(
          "change",
          async (e) => {
            const text = await inputElem.files[0].text();
            inputElem.remove();
            let obj;
            try {
              obj = JSON.parse(text);
              if (!obj.addonId) {
                // Check if it's a full extension settings file
                const settings = obj?.addons?.[this.addon._addonId]?.settings;
                if (settings) {
                  this.loadPreset({ id: "extracted-settings", values: settings });
                  return;
                } else {
                  throw "Missing addon ID";
                }
              }
              if (obj.addonId !== this.addon._addonId) {
                console.warn(`Incorrect addon ID: ${obj.addonId}`);
                alert(this.msg("incorrectAddonImport", this.$root.manifestsById[obj.addonId].name));
                return;
              }
            } catch (e) {
              console.warn(`Error importing settings file for ${this.addon._addonId}:`, e);
              alert(chrome.i18n.getMessage("importFailed"));
              return;
            }
            this.loadPreset(obj);
          },
          { once: true }
        );
        inputElem.addEventListener(
          "cancel",
          () => {
            inputElem.remove();
          },
          { once: true }
        );
        document.body.appendChild(inputElem);
        inputElem.click();
        this.toggleDropdown();
      },
      exportPreset() {
        const preset = {
          addonId: this.addon._addonId,
          id: "custom-preset",
          values: this.addonSettings,
        };
        const blob = new Blob([JSON.stringify(preset)], { type: "application/json" });
        const name = this.addon.name.replaceAll(" ", "-").toLowerCase();
        downloadBlob(`${name}.json`, blob);
        this.toggleDropdown();
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
          // Do not collapse when disabling in related addons view
          this.expanded = this.$root.relatedAddonsOpen
            ? this.expanded
            : isIframe && !this.expanded && (this.addon.info || []).every((item) => item.type !== "warning")
              ? false
              : event.shiftKey
                ? false
                : newState;
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
              document.querySelector(".popup").style.animation = "dropDown 0.35s 1";
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
      openRelated(clickedAddon) {
        this.$root.openRelatedAddons(this.addon);
        this.$root.blinkAddon(clickedAddon._addonId);
      },
      toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        this.$root.closePickers({ isTrusted: true }, null, {
          callCloseDropdowns: false,
        });
        this.$root.closeDropdowns({ isTrusted: true }, this); // close other dropdowns
      },
    },
    watch: {
      groupId(newValue) {
        // Happens when going from "example" addon to real addon
        this.expanded = this.getDefaultExpanded();
      },
      searchInput(newValue) {
        if (newValue === "") this.expanded = this.getDefaultExpanded();
        else this.expanded = false;
      },
      expanded(newValue) {
        if (newValue === true) this.everExpanded = true;
      },
    },
    events: {
      closeDropdowns(...params) {
        return this.$root.closeDropdowns(...params);
      },
    },
    ready() {
      this.$root.$on("close-dropdowns", (except) => {
        if (this.isDropdownOpen && this !== except) {
          this.isDropdownOpen = false;
        }
      });
      const onHashChange = () => {
        if (location.hash.replace(/^#addon-/, "") === this.addon._addonId) {
          this.expanded = true;
        }
      };
      window.addEventListener("hashchange", onHashChange, { capture: false });
      setTimeout(onHashChange, 0);
    },
  });
  Vue.component("addon-body", AddonBody);
}
