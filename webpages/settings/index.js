const vue = new Vue({
  el: "body",
  data: {
    manifests: [],
    selectedTab: "all",
    selectedTag: null,
    searchInput: "",
    addonSettings: {},
    tags: [
      {
        name: "Recommended",
        matchType: "tag",
        matchName: "recommended",
        color: "blue",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          themes: false,
        },
      },
      {
        name: "Beta",
        matchType: "tag",
        matchName: "beta",
        color: "red",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          themes: true,
        },
      },
      {
        name: "Forums",
        matchType: "tag",
        matchName: "forums",
        color: "green",
        tabShow: {
          all: true,
          editor: false,
          community: true,
          themes: false,
        },
      },
    ],
  },
  methods: {
    clearSearch() {
      this.searchInput = "";
    },
    addonMatchesFilters(addonManifest) {
      const matchesTag = this.selectedTag === null || addonManifest.tags.includes(this.selectedTag);
      const matchesSearch =
        this.searchInput === "" ||
        addonManifest.name.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        addonManifest.description.toLowerCase().includes(this.searchInput.toLowerCase());
      return matchesTag && matchesSearch;
    },
    stopPropagation(e) {
      e.stopPropagation();
    },
    toggleAddonRequest(addon) {
      const toggle = () => {
        const newState = !addon._enabled;
        addon._enabled = newState;
        addon._expanded = newState;
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: addon._addonId, newState } });
      };

      const browserLevelPermissions = ["notifications"];
      const requiredPermissions = (addon.permissions || []).filter((value) => browserLevelPermissions.includes(value));
      if (!addon._enabled && requiredPermissions.length) {
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
    },
    updateSettings(addon) {
      chrome.runtime.sendMessage({
        changeAddonSettings: { addonId: addon._addonId, newSettings: this.addonSettings[addon._addonId] },
      });
      console.log("Updated", this.addonSettings[addon._addonId]);
    },
  },
});

chrome.runtime.sendMessage("getSettingsInfo", ({ manifests, addonsEnabled, addonSettings }) => {
  console.log(manifests, addonsEnabled, addonSettings);
  vue.addonSettings = addonSettings;
  for (const { manifest, addonId } of manifests) {
    manifest._category = manifest.tags.includes("theme")
      ? "theme"
      : manifest.tags.includes("community")
      ? "community"
      : "editor";
    manifest._enabled = addonsEnabled[addonId];
    manifest._addonId = addonId;
    manifest._expanded = manifest._enabled;
    manifest._tags = {};
    manifest._tags.recommended = manifest.tags.includes("recommended");
    manifest._tags.beta = manifest.tags.includes("beta");
    manifest._tags.forums = manifest.tags.includes("forums");
  }
  // Sort: enabled first, then recommended disabled, then other disabled addons. All alphabetically.
  manifests.sort((a, b) => {
    if (a.manifest._enabled === true && b.manifest._enabled === false) return -1;
    else if (a.manifest._enabled === b.manifest._enabled) {
      if (a.manifest.name.localeCompare(b.manifest.name) === 1) {
        if (a.manifest._tags.recommended === true && b.manifest._tags.recommended === false) return -1;
        else return 1;
      } else return -1;
    } else return 1;
  });
  vue.manifests = manifests.map(({ manifest }) => manifest);
});

vue.$watch("selectedTab", function (newSelectedTab) {
  this.selectedTag = null;
});
window.addEventListener("keydown",function (e) {
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) { 
        e.preventDefault();
        $('#searchBox').focus();
    }
})
