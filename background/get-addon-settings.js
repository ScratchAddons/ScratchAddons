import minifySettings from "../libraries/common/minify-settings.js";
import {ADDON_SETTINGS_KEYS, createContext, transitionToNewStorageKeys} from "./imports/addon-transition.js"

runAddonTransitions();

async function runAddonTransitions() {
  const storageItems = await chrome.storage.sync.get([...ADDON_SETTINGS_KEYS, "addonsEnabled"]);

  // We check if the third key exists, but it wouldn't matter which one of the three we use.
  const addonSettingsEmpty = !storageItems.addonSettings3;

  // Since v1.33.0, addon settings are split up across three storage keys to help stay below a storage quota.
  // Check if "addonSettings" exists and "addonSettings3" does not exist.
  if (storageItems.addonSettings && addonSettingsEmpty) {
    transitionToNewStorageKeys(storageItems.addonSettings);
    return;
  }

  const addonsEnabled = storageItems.addonsEnabled || {};
  const addonSettings = addonSettingsEmpty
    ? {} // Default value
    : { ...storageItems.addonSettings1, ...storageItems.addonSettings2, ...storageItems.addonSettings3 };

  await new Promise((resolve) => {
    if (scratchAddons.localState.ready.manifests) resolve();
    else scratchAddons.localEvents.addEventListener("manifestsReady", resolve);
  });

  const { addonSetting, addonState, madeChanges, createSettingsContext } = createContext(addonsEnabled, addonSettings);

  // All changes that involving enabling and/or changing settings for newly made addons.
  const transitionNewAddons = () => {
    if (addonState("editor-devtools") === "enabled" && addonState("move-to-top-bottom") === "new") {
      // Existing editor-devtools users should have move-to-top-bottom enabled.
      addonState("move-to-top-bottom", "enabled");
    }

    if (addonSetting("editor-dark-mode", "textShadow") === true && addonState("custom-block-text") === "new") {
      // Transition v1.23 to v1.24
      // Moved text shadow option to the custom-block-text addon
      addonState("custom-block-text", addonState("editor-dark-mode"));
      addonSetting("editor-dark-mode", "textShadow", { remove: true });
      addonSetting("custom-block-text", "shadow", { set: true });
      // `shadow` isn't the only setting - the other setting, `bold`, is set
      // to its default (false) inside the for loop below.
    }

    if (addonState("editor-devtools") === "disabled") {
      // Transition 1.27.0 to 1.28.0
      // Disable addons previously part of devtools, if devtools is disabled
      if (addonState("find-bar") === "new") {
        addonState("find-bar", "disabled");
      }
      if (addonState("jump-to-def") === "new") {
        addonState("jump-to-def", "disabled");
      }
      // Transition 1.29.0 to 1.30.0
      if (addonState("middle-click-popup") === "new") {
        addonState("middle-click-popup", "disabled");
      }
    }

    if (addonState("custom-menu-bar") === "new") {
      // Transition v1.35 to v1.36
      if (addonState("tutorials-button") === "enabled") {
        // Hide Tutorials button is now a setting in Customizable menu bar. Enable it for existing addon users.
        addonState("custom-menu-bar", "enabled");
        addonSetting("custom-menu-bar", "hide-tutorials-button", { set: true });
      }
      if (addonState("editor-compact") === "enabled") {
        // The icons on the menu bar buttons are now hidden via Customizable menu bar.
        // Enable it for existing Compact editor users.
        addonState("custom-menu-bar", "enabled");
        addonSetting("custom-menu-bar", "menu-labels", { set: "labels" });
      }
    }

    if (addonState("editor-dark-mode") === "enabled" && addonSetting("editor-dark-mode", "dots") === false) {
      // Transition v1.38 to v1.39
      addonSetting("editor-dark-mode", "dots", { remove: true });
      addonState("workspace-dots", "enabled");
      addonSetting("workspace-dots", "theme", { set: "none" });
    }
  };
  transitionNewAddons();

  for (const { manifest, addonId } of scratchAddons.manifests) {
    const { setting, changesMade } = createSettingsContext(addonId);

    if (manifest.settings) {
      for (const option of manifest.settings) {
        const settingValue = setting(option.id);
        if (settingValue === undefined) {
          // Fill in with default value
          // Cloning required for tables
          setting(option.id, { set: JSON.parse(JSON.stringify(option.default)) });
        } else if (option.type === "positive_integer" || option.type === "integer") {
          // ^ else means typeof can't be "undefined", so it must be number
          if (typeof settingValue !== "number") {
            // This setting was stringified, see #2142
            const number = Number(settingValue);
            // Checking if NaN just in case
            const newValue = Number.isNaN(number) ? option.default : number;
            setting(option.id, { set: newValue });
          }
        } else if (option.type === "table") {
          const tableSettingIds = option.row.map((setting) => setting.id);
          // TODO:
          setting(option.id).forEach((item, i) => {
            option.row.forEach((setting) => {
              if (item[setting.id] === undefined) {
                item[setting.id] = option.default[i][setting.id];
              }
            });
            for (const def in item) {
              if (!tableSettingIds.includes(def)) {
                delete item[def];
              }
            }
          });
        }
      }

      if (addonId === "editor-dark-mode") {
        // Transition v1.27 to v1.28
        // editor-dark-mode enabled opacity to the block palette.
        // We append "cc" to the color so that it's the same as before this update.
        const paletteValue = setting("palette");
        if (paletteValue !== undefined && paletteValue.length === 7) {
          setting("palette", { set: paletteValue + "cc" });
        }
      }

      // // Transitions involving presets.
      // const transitionPresets = () => {

      // }

      // // Not new addons... ussually involving setting changes.
      // const transitionOldAddons

      if (addonId === "dark-www") {
        // Transition v1.22.0 to v1.23.0
        if (
          (typeof setting("primaryColor") === "string" && setting("primaryColor") !== "#4d97ff") ||
          (typeof setting("linkColor") === "string" && setting("linkColor") !== "#4d97ff")
        ) {
          if (addonState("dark-www") !== "enabled") {
            addonState("dark-www", addonState("scratchr2"));
            // TODO:
            Object.assign(settings, manifest.presets.find((preset) => preset.id === "scratch").values);
          }
          if (typeof scratchr2.primaryColor === "string")
            setting("navbar", { set: setting("button", { set: setting("primaryColor") }) });
          if (typeof scratchr2.linkColor === "string") setting("link", { set: setting("linkColor") });
          setting("primaryColor", { remove: true });
          setting("linkColor", { remove: true });
        }


        updatePresetIfMatching(
          1,
          {
            navbar: "#4d97ff",
          },
          () => setting("navbar", "#855cd6")
        );
        updatePresetIfMatching(
          2,
          {
            // Old blue "highlight color" setting
            button: "#4d97ff", // Same old color as "navbar" setting.
          },
          () => setting("button", "#855cd6") // Same new color as migration #1
        );
        updatePresetIfMatching(
          3,
          {
            // "Experimental Dark" preset (as of v1.33.1 - now renamed)
            page: "#202020",
            // navbar: "#4d97ff",
            box: "#282828",
            gray: "#333333",
            blue: "#252c37",
            input: "#202020",
            // button: "#4d97ff",
            link: "#4d97ff",
            footer: "#333333",
            border: "#606060",
          },
          () => setting("blue", "#292d32"),
          setting("link", "#ccb3ff")
        );
        updatePresetIfMatching(
          4,
          // "Dark WWW" preset
          {
            page: "#242527",
            // navbar: "#4d97ff",
            box: "#2f3137",
            gray: "#424346",
            blue: "#1b1d1f",
            input: "#3a3a3a",
            // button: "#4d97ff",
            link: "#4d97ff",
            footer: "#17181a",
            border: "#000000",
          },
          () => setting("link", "#ccb3ff") // Same new color as migration #3
        );
        updatePresetIfMatching(
          5,
          // "Scratch default colors" preset (as of v1.33.1 - now renamed)
          {
            page: "#fcfcfc",
            // navbar: "#4d97ff",
            box: "#ffffff",
            gray: "#f2f2f2",
            blue: "#e9f1fc",
            input: "#fafafa",
            // button: "#4d97ff",
            link: "#4d97ff",
            footer: "#f2f2f2",
            border: "#0000001a",
          },
          () => setting("link", "#855cd6")
        );

        updatePresetIfMatching(
          6,
          // "Scratch default colors (blue)" preset
          {
            page: "#fcfcfc",
            box: "#ffffff",
            gray: "#f2f2f2",
            blue: "#e9f1fc",
            input: "#fafafa",
            link: "#4d97ff",
            footer: "#f2f2f2",
            border: "#0000001a",
          },
          () => setting("messageIndicatorOnMessagesPage", "#ffab1a")
        );
        updatePresetIfMatching(
          7,
          // "Experimental Dark (blue)" preset
          {
            page: "#202020",
            box: "#282828",
            gray: "#333333",
            blue: "#252c37",
            input: "#202020",
            link: "#4d97ff",
            footer: "#333333",
            border: "#606060",
          },
          () => setting("messageIndicatorOnMessagesPage", "#ffab1a") // Same as above
        );
      }

      if (addonId === "editor-dark-mode") {
        const version = setting("_version");
        const migratingPresetsV1_32 = version && version < 3;
        let newPopupSettingValue = null;
        updatePresetIfMatching(
          3,
          {
            // "Dark editor" preset
            page: "#2e2e2e",
            primary: "#47566b",
            highlightText: "#4d97ff",
            menuBar: "#47566b",
            activeTab: "#555555",
            tab: "#444444",
            selector: "#333333",
            selector2: "#333333",
            selectorSelection: "#3a3a3a",
            accent: "#333333",
            input: "#444444",
            workspace: "#444444",
            categoryMenu: "#333333",
            palette: "#222222cc",
            border: "#111111",
          },
          () => (newPopupSettingValue = "#47566be6")
        );
        updatePresetIfMatching(
          4,
          {
            // "TurboWarp dark" preset
            page: "#111111",
            primary: "#ff4d4d",
            highlightText: "#ff4d4d",
            menuBar: "#333333",
            activeTab: "#1e1e1e",
            tab: "#2e2e2e",
            selector: "#1e1e1e",
            selector2: "#2e2e2e",
            selectorSelection: "#111111",
            accent: "#111111",
            input: "#1e1e1e",
            workspace: "#1e1e1e",
            categoryMenu: "#111111",
            palette: "#111111cc",
            border: "#ffffff26",
          },
          () => (newPopupSettingValue = "#333a")
        );
        updatePresetIfMatching(
          5,
          {
            // "Scratch 2.0" preset
            page: "#ffffffff",
            primary: "#179fd7ff",
            highlightText: "#1e9ed6",
            menuBar: "#9c9ea2ff",
            activeTab: "#e6e8e8",
            tab: "#f1f2f2ff",
            selector: "#e6e8e8",
            selector2: "#e6e8e8",
            selectorSelection: "#d0d0d0ff",
            accent: "#f2f2f2",
            input: "#ffffffff",
            workspace: "#dddedeff",
            categoryMenu: "#e6e8e8ff",
            palette: "#e6e8e8cc",
            border: "#d0d1d2",
          },
          () => (newPopupSettingValue = "#00000099")
        );
        updatePresetIfMatching(
          6,
          {
            // "Scratch 1.x" preset
            page: "#c0c3c6",
            primary: "#5498c7",
            highlightText: "#21211f",
            menuBar: "#c0c3c6",
            activeTab: "#b9d7e5",
            tab: "#adadb5",
            selector: "#6a6a6a",
            selector2: "#7c8083",
            selectorSelection: "#404143",
            accent: "#959a9f",
            input: "#5f6265",
            workspace: "#7c8083",
            categoryMenu: "#969a9f",
            palette: "#7c8083cc",
            border: "#0000006b",
          },
          () => (newPopupSettingValue = "#00000099")
        );

        if (!newPopupSettingValue && migratingPresetsV1_32) {
          // https://github.com/ScratchAddons/ScratchAddons/pull/5931#issuecomment-1529426595
          if (setting("primary")) newPopupSettingValue = setting("primary").substring(0, 7) + "e6";
        }

        if (newPopupSettingValue) {
          console.log("Migrated `popup` setting from editor-dark-mode to: ", newPopupSettingValue);
          setting("popup", { set: newPopupSettingValue });
        }

        updatePresetIfMatching(
          7,
          {
            // "Experimental Dark" preset
            page: "#263241",
            primary: "#4d97ff",
            highlightText: "#4d97ff",
            menuBar: "#4d97ff",
            activeTab: "#282828",
            tab: "#202020",
            selector: "#252c37",
            selector2: "#202020",
            selectorSelection: "#282828",
            accent: "#282828",
            input: "#282828",
            workspace: "#282828",
            categoryMenu: "#282828",
            palette: "#333333cc",
            border: "#444444",
          },
          () => {
            console.log("Migrated Experimental Dark preset.");
            setting("page", { set: "#2e3238" });
            setting("primary", { set: "#855cd6" });
            setting("highlightText", { set: "#ccb3ff" });
            setting("selector", { set: "#292d32" });
            // Changing the menuBar ("menu bar background") setting is handled by migration #10.
          }
        );
        updatePresetIfMatching(
          8,
          {
            // "3.Darker" preset
            page: "#111111",
            primary: "#4d97ff",
            highlightText: "#4d97ff",
            menuBar: "#202020",
            activeTab: "#202020",
            tab: "#151515",
            selector: "#202020",
            selector2: "#202020",
            selectorSelection: "#111111",
            accent: "#151515",
            input: "#202020",
            workspace: "#151515",
            categoryMenu: "#202020",
            palette: "#202020cc",
            border: "#ffffff0d",
          },
          () => {
            console.log("Migrated 3.Darker preset.");
            // Applies only 2 of the 5 changes from migration #7 with the exact same colors.
            setting("primary", { set: "#855cd6" });
            setting("highlightText", { set: "#ccb3ff" });
          }
        );
        updatePresetIfMatching(
          9,
          {
            // "Scratch 3.0 default colors" preset (as of v1.33.1 - now renamed)
            page: "#e5f0ff",
            primary: "#4d97ff",
            highlightText: "#4d97ff",
            menuBar: "#4d97ff",
            activeTab: "#ffffff",
            tab: "#d9e3f2",
            selector: "#e9f1fc",
            selector2: "#d9e3f2",
            selectorSelection: "#ffffff",
            accent: "#ffffff",
            input: "#ffffff",
            workspace: "#f9f9f9",
            categoryMenu: "#ffffff",
            palette: "#f9f9f9cc",
            border: "#00000026",
          },
          () => {
            console.log("Migrated Scratch 3.0 default colors preset.");
            // Applies the same color (#855cd6) to the "highlight color" and "text and icon highlight color" settings.
            setting("primary", { set: "#855cd6" });
            setting("highlightText", { set: "#855cd6" });
            // Changing the menuBar ("menu bar background") setting is handled by migration #10.
          }
        );
        updatePresetIfMatching(
          10,
          {
            // Old vanilla "menu bar background" (blue)
            menuBar: "#4d97ff",
          },
          () => {
            console.log("Migrated 'menu bar background' setting from old blue to new purple.");
            // New vanilla "menu bar background" (purple)
            setting("menuBar", { set: "#855cd6" });
          }
        );
      }

      if (addonId === "editor-theme3") {
        updatePresetIfMatching(
          1,
          {
            "motion-color": "#4a6cd4",
            "looks-color": "#8a55d7",
            "sounds-color": "#bb42c3",
            "events-color": "#c88330",
            "control-color": "#e1a91a",
            "sensing-color": "#2ca5e2",
            "operators-color": "#5cb712",
            "data-color": "#ee7d16",
            "data-lists-color": "#cc5b22",
            "custom-color": "#632d99",
            "Pen-color": "#0e9a6c",
            "sa-color": "#29beb8",
            "input-color": "#ffffff",
            text: "white",
          },
          manifest.presets.find((p) => p.id === "original")
        );
        updatePresetIfMatching(
          2,
          {
            "motion-color": "#004099",
            "looks-color": "#220066",
            "sounds-color": "#752475",
            "events-color": "#997300",
            "control-color": "#664100",
            "sensing-color": "#1f5f7a",
            "operators-color": "#235c23",
            "data-color": "#b35900",
            "data-lists-color": "#993300",
            "custom-color": "#99004d",
            "Pen-color": "#064734",
            "sa-color": "#166966",
            "input-color": "#202020",
            text: "white",
          },
          manifest.presets.find((p) => p.id === "dark")
        );
        updatePresetIfMatching(
          3,
          {
            "motion-color": "#4C97FF",
            "looks-color": "#9966FF",
            "sounds-color": "#CF63CF",
            "events-color": "#FFBF00",
            "control-color": "#FFAB19",
            "sensing-color": "#5CB1D6",
            "operators-color": "#59C059",
            "data-color": "#FF8C1A",
            "data-lists-color": "#FF661A",
            "custom-color": "#FF6680",
            "Pen-color": "#0FBD8C",
            "sa-color": "#29BEB8",
            "comment-color": "#FEF49C",
            "input-color": "#202020",
            text: "colorOnBlack",
          },
          manifest.presets.find((p) => p.id === "black")
        );

        if (setting("darkComments") === false) {
          // Transition v1.28 to v1.29
          // Override the preset color if dark comments are not enabled
          setting("comment-color", { set: "#FEF49C" });
        }
      }

      if (addonId === "forum-quote-code-beautifier") {
        updatePresetIfMatching(1, { bordercolor: "#28A5DA" }, () => setting("bordercolor", "#855cd6"));
      }

      if (addonId === "colorblind" && setting("links")) {
        // Transition v1.34 to v1.35
        if (setting("links") !== "underline") setting("underline-style", { set: "none" });
        if (setting("links") === "bold") {
          setting("bold", { set: "all" });
        } else {
          setting("bold", { set: "default" });
        }
        setting("links", { remove: true });
      }

      if (addonId === "fullscreen" && setting("hideToolbar") !== undefined) {
        // Transition v1.36 to v1.37
        if (!setting("hideToolbar")) {
          setting("toolbar", { set: "show" });
        } else if (setting("hoverToolbar")) {
          setting("toolbar", { set: "hover" });
        } else {
          setting("toolbar", { set: "hide" });
        }
        setting("hideToolbar", { remove: true });
        setting("hoverToolbar", { remove: true });
      }
    }

    if (addonState(addonId) === "new") addonState(addonId, !!manifest.enabledByDefault ? "enabled" : "disabled");

    if (changesMade) {
      console.log(`Changed settings for addon ${addonId}`);
      addonSettings[addonId] = settings; // In case settings variable was a newly created object
    }
  }

  // Finally, minify the settings and store them in the scratchAddons object
  const prerelease = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
  if (madeChanges)
    chrome.storage.sync.set({
      ...minifySettings(addonSettings, prerelease ? null : scratchAddons.manifests),
      addonsEnabled,
    });
  scratchAddons.globalState.addonSettings = addonSettings;
  scratchAddons.localState.addonsEnabled = addonsEnabled;
  scratchAddons.localState.ready.addonSettings = true;
}
