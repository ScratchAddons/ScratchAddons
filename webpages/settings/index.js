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
          theme: false,
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
          theme: false,
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
          theme: false,
        },
      },
      {
        name: "For editor",
        matchType: "tag",
        matchName: "editor",
        color: "blue",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
      {
        name: "For website",
        matchType: "tag",
        matchName: "community",
        color: "red",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
    ],
  },
  methods: {
    openFeedback() {
      window.open(`https://scratchaddons.com/feedback?version=${chrome.runtime.getManifest().version}`);
    },
    clearSearch() {
      this.searchInput = "";
    },
    addonMatchesFilters(addonManifest) {
      const matchesTag = this.selectedTag === null || addonManifest.tags.includes(this.selectedTag);
      const matchesSearch =
        this.searchInput === "" ||
        addonManifest.name.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        addonManifest.description.toLowerCase().includes(this.searchInput.toLowerCase()) ||
        (addonManifest.credits &&
          addonManifest.credits
            .map((obj) => obj.name.toLowerCase())
            .some((author) => author.includes(this.searchInput.toLowerCase())));
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

      const browserLevelPermissions = ["notifications", "clipboardWrite"];
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
    updateSelect(settingId, newValue, addon) {
      this.addonSettings[addon._addonId][settingId] = newValue;
      this.updateSettings(addon);
    },
    updateSettings(addon) {
      chrome.runtime.sendMessage({
        changeAddonSettings: { addonId: addon._addonId, newSettings: this.addonSettings[addon._addonId] },
      });
      console.log("Updated", this.addonSettings[addon._addonId]);
    },
  },
  watch: {
    selectedTab() {
      this.selectedTag = null;
    },
  },
});

chrome.runtime.sendMessage("getSettingsInfo", ({ manifests, addonsEnabled, addonSettings }) => {
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
    manifest._tags.forEditor = manifest.tags.includes("theme") && manifest.tags.includes("editor");
    manifest._tags.forWebsite = manifest.tags.includes("theme") && manifest.tags.includes("community");
  }
  // Sort: enabled first, then recommended disabled, then other disabled addons. All alphabetically.
  manifests.sort((a, b) => {
    if (a.manifest._enabled === true && b.manifest._enabled === true)
      return a.manifest.name.localeCompare(b.manifest.name);
    else if (a.manifest._enabled === true && b.manifest._enabled === false) return -1;
    else if (a.manifest._enabled === false && b.manifest._enabled === false) {
      if (a.manifest._tags.recommended === true && b.manifest._tags.recommended === false) return -1;
      else if (a.manifest._tags.recommended === false && b.manifest._tags.recommended === true) return 1;
      else return a.manifest.name.localeCompare(b.manifest.name);
    } else return 1;
  });
  // Messaging related addons should always go first no matter what
  manifests.sort((a, b) => (a.addonId === "msg-count-badge" ? -1 : b.addonId === "msg-count-badge" ? 1 : 0));
  manifests.sort((a, b) => (a.addonId === "scratch-messaging" ? -1 : b.addonId === "scratch-messaging" ? 1 : 0));
  vue.manifests = manifests.map(({ manifest }) => manifest);
});

window.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "f") {
    e.preventDefault();
    document.querySelector("#searchBox").focus();
  }
});
