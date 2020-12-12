//theme switching
const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", "light.css");
chrome.storage.sync.get(["globalTheme"], function (r) {
  let rr = false; //true = light, false = dark
  if (r.globalTheme) rr = r.globalTheme;
  if (rr) {
    document.head.appendChild(lightThemeLink);
    vue.theme = true;
    vue.themePath = "../../images/icons/moon.svg";
  } else {
    vue.theme = false;
    vue.themePath = "../../images/icons/theme.svg";
  }
});

const vue = new Vue({
  el: "body",
  data: {
    smallMode: false,
    theme: "",
    themePath: "",
    switchPath: "../../images/icons/switch.svg",
    isOpen: false,
    categoryOpen: true,
    loaded: false,
    manifests: [],
    selectedTab: "all",
    selectedTag: null,
    searchInput: "",
    addonSettings: {},
    tags: [
      {
        name: chrome.i18n.getMessage("recommended"),
        matchType: "tag",
        matchName: "recommended",
        color: "blue",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          theme: true,
        },
      },
      {
        name: chrome.i18n.getMessage("beta"),
        matchType: "tag",
        matchName: "beta",
        color: "red",
        tabShow: {
          all: true,
          editor: true,
          community: true,
          theme: true,
        },
      },
      {
        name: chrome.i18n.getMessage("forums"),
        matchType: "tag",
        matchName: "forums",
        color: "green",
        tabShow: {
          all: false,
          editor: false,
          community: true,
          theme: false,
        },
      },
      {
        name: chrome.i18n.getMessage("forEditor"),
        matchType: "tag",
        matchName: "editor",
        color: "darkgreen",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
      {
        name: chrome.i18n.getMessage("forWebsite"),
        matchType: "tag",
        matchName: "community",
        color: "yellow",
        tabShow: {
          all: false,
          editor: false,
          community: false,
          theme: true,
        },
      },
    ],
  },
  computed: {
    tagsToShow() {
      return this.tags.filter((tag) => tag.tabShow[this.selectedTab]);
    },
    version() {
      return chrome.runtime.getManifest().version;
    },
    versionName() {
      return chrome.runtime.getManifest().version_name;
    },
  },
  methods: {
    closesidebar: function () {
      if (this.categoryOpen && this.smallMode) {
        vue.sidebarToggle();
      }
      if (this.isOpen) {
        this.modalToggle;
      }
    },

    modalToggle: function () {
      this.isOpen = !this.isOpen;
      if (vue.smallMode) {
        vue.sidebarToggle();
      }
    },
    sidebarToggle: function () {
      this.categoryOpen = !this.categoryOpen;
      if (this.categoryOpen) {
        vue.switchPath = "../../images/icons/close.svg";
      } else {
        vue.switchPath = "../../images/icons/switch.svg";
      }
    },
    msg(message, ...params) {
      return chrome.i18n.getMessage(message, ...params);
    },
    openReview() {
      if (typeof browser !== "undefined") {
        window.open(`https://addons.mozilla.org/en-US/firefox/addon/scratch-messaging-extension/reviews/`);
      } else {
        window.open(
          `https://chrome.google.com/webstore/detail/scratch-addons/fbeffbjdlemaoicjdapfpikkikjoneco/reviews`
        );
      }
    },
    openCredits() {
      window.open(`https://scratchaddons.com/contributors`);
    },
    openFeedback() {
      window.open(`https://scratchaddons.com/feedback?version=${chrome.runtime.getManifest().version_name}`);
    },
    clearSearch() {
      this.searchInput = "";
    },
    setTheme(mode) {
      chrome.storage.sync.get(["globalTheme"], function (r) {
        let rr = true; //true = light, false = dark
        rr = mode;
        chrome.storage.sync.set({ globalTheme: rr }, function () {
          if (rr && r.globalTheme !== rr) {
            document.head.appendChild(lightThemeLink);
            vue.theme = true;
            vue.themePath = "../../images/icons/moon.svg";
          } else if (r.globalTheme !== rr) {
            document.head.removeChild(lightThemeLink);
            vue.theme = false;
            vue.themePath = "../../images/icons/theme.svg";
          }
        });
      });
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
    updateOption(id, newValue, addon) {
      this.addonSettings[addon._addonId][id] = newValue;
      this.updateSettings(addon);
    },
    updateSettings(addon) {
      chrome.runtime.sendMessage({
        changeAddonSettings: { addonId: addon._addonId, newSettings: this.addonSettings[addon._addonId] },
      });
      console.log("Updated", this.addonSettings[addon._addonId]);
    },
    loadPreset(preset, addon) {
      if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
        for (const property in preset.values) {
          this.updateOption(property, preset.values[property], addon);
        }
        console.log(`Loaded preset ${preset.id} for ${addon.id}`);
      }
    },
    loadDefaults(addon) {
      if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
        for (const property of addon.settings) {
          this.updateOption(property.id, property.default, addon);
        }
        console.log(`Loaded default values for ${addon.id}`);
      }
    },
    textParse(text, addon) {
      const regex = /([\\]*)(@|#)([a-zA-Z0-9.\-\/_]*)/g;
      return text.replace(regex, (icon) => {
        if (icon[0] == "\\") {
          return icon.slice(1);
        }
        if (icon[0] == "@") {
          return `<img class="inline-icon" src="../../images/icons/${icon.split("@")[1]}"/>`;
        }
        if (icon[0] == "#") {
          return `<img class="inline-icon" src="../../addons/${addon._addonId}/${icon.split("#")[1]}"/>`;
        }
      });
    },
    devShowAddonIds(event) {
      if (!this.versionName.endsWith("-prerelease") || this.shownAddonIds) return;
      event.stopPropagation();
      this.shownAddonIds = true;
      this.manifests.forEach((manifest) => {
        manifest.name = manifest._addonId;
      });
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
  vue.loaded = true;
  setTimeout(() => document.getElementById("searchBox").focus(), 0);
  setTimeout(handleKeySettings, 0);
  setTimeout(createTooltip, 0);
});

function createTooltip() {
  let phrases = {
    "Scratch Messaging": "Shows in the popup! From the original extension.",
    "Block switching": "An old 2.0 feature!",
    "Cloud games": "Shows in the popup! From the original extension.",
    "Developer tools": "From the extension by griffpatch.",
    "Fix \"Load more\" scrolling in search results": "This bug only applys to chrome.",
    "Scratch Notifier": "From the extension by World_Languages.",
    "Thumbnails setter": "Set the thumbnails for your projects while also not letting Scratch change it.",
    "Colored context menus": "An old 2.0 feature!",
    "Discuss button": "An old 2.0 feature!",
    "Display stage on left side": "An old 2.0 feature!",
    "Feature unshared projects": "Have an unshared project featured on your profile!",
    "Forum Search": "An old 2.0 feature!",
    "Live featured project": "Run a user's featured project right in their profile!",
    "Mouse position": "An old 2.0 feature!",
    "Remix tree button on project pages": "An old 2.0 feature!",
    "Sprite and script count": "An old 2.0 feature!",
    "*": [
      "Some addons have settings, enable them in the dropdowns!",
      "Some addons are marked as beta... be careful!",
      "There are even more setting! Try clicking the \"More Settings\" button on the left!",
      "Can you help translate? Click $0 to learn more!",
      "Want to make an addon? Click $1 to learn more!",
      "Try some filters! Might help find what you need!",
      "You can change the theme in the top right corner!",
      "Be sure to thank the creators of the addon!",
      "No addons take information... You can check out our code $2!",
      "Did you find bugs? Report them $3!",
      "Have an new idea for an addon? Ask for one $3!",
      "Enjoying this extension? Rate us $4!"
    ]
  }
  let links = {
    "$0": {
      "replace": "here",
      "link": "https://github.com/ScratchAddons/ScratchAddons/wiki/How-to-join-the-localization-team"
    },
    "$1": {
      "replace": "here",
      "link": "https://github.com/ScratchAddons/ScratchAddons/wiki/Creating-an-addon"
    },
    "$2": {
      "replace": "here",
      "link": "https://github.com/ScratchAddons/ScratchAddons"
    },
    "$3": {
      "replace": "here",
      "method": "openFeedback"
    },
    "$4": {
      "replace": "here",
      "method": "openReview"
    }
  }
  let addonname = document.querySelectorAll(".addon-name")[vue.manifests.findIndex(o => !o._enabled && !o.tags.includes("beta") && Math.random() > 0.7)];
  if (addonname) {
    addonname.classList.add("tooltip")
    let tooltip = addonname.appendChild(document.createElement("span"));
    tooltip.className = "tooltiptextspecial";
    let tooltiptext = phrases[addonname.innerText.trim()] || phrases["*"][Math.floor(Math.random() * phrases["*"].length)];
    while (tooltiptext.includes("$")) {
      tooltip.appendChild(document.createTextNode(tooltiptext.substring(0, tooltiptext.indexOf("$"))))
      let link = tooltip.appendChild(document.createElement("a"));
      let linkInfo = links["$" + tooltiptext.charAt(tooltiptext.indexOf("$") + 1)]
      if (linkInfo.link) link.href = linkInfo.link
      else link.setAttribute("data-click", linkInfo.method)
      link.innerText = linkInfo.replace
      tooltiptext = tooltiptext.substring(tooltiptext.indexOf("$")+2, tooltiptext.length)
    }
    tooltip.appendChild(document.createTextNode(tooltiptext));
    tooltip.addEventListener("click", e => {
      e.preventDefault();
      e.cancelBubble = true;
      if (e.target.tagName == "A") {
        if (e.target.href) window.open(e.target.href);
        else vue[e.target.getAttribute("data-click")]();
      } else tooltip.style.visibility = "hidden";
    });
  }
}

function handleKeySettings() {
  let keyInputs = document.querySelectorAll(".key");
  for (const input of keyInputs) {
    input.addEventListener("keydown", function (e) {
      e.preventDefault();
      e.target.value = e.ctrlKey
        ? "Ctrl" +
          (e.shiftKey ? " + Shift" : "") +
          (e.key == "Control" || e.key == "Shift"
            ? ""
            : (e.ctrlKey ? " + " : "") +
              (e.key.toUpperCase() === e.key
                ? e.code.includes("Digit")
                  ? e.code.substring(5, e.code.length)
                  : e.key
                : e.key.toUpperCase()))
        : "";
      vue.updateOption(
        e.target.getAttribute("data-setting-id"),
        e.target.value,
        vue.manifests.find((manifest) => manifest._addonId === e.target.getAttribute("data-addon-id"))
      );
    });
    input.addEventListener("keyup", function (e) {
      // Ctrl by itself isn't a hotkey
      if (e.target.value == "Ctrl") e.target.value = "";
    });
  }
}

window.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "f") {
    e.preventDefault();
    document.querySelector("#searchBox").focus();
  } else if (e.key === "Escape" && document.activeElement === document.querySelector("#searchBox")) {
    e.preventDefault();
    vue.searchInput = "";
  }
});

document.title = chrome.i18n.getMessage("settingsTitle");
function resize() {
  if (window.innerWidth < 1000) {
    vue.smallMode = true;
    vue.categoryOpen = false;
    vue.switchPath = "../../images/icons/switch.svg";
  } else if (vue.smallMode != false) {
    vue.smallMode = false;
    vue.categoryOpen = true;
    vue.switchPath = "../../images/icons/close.svg";
  }
}
window.onresize = resize;
resize();

chrome.runtime.sendMessage("checkPermissions");
