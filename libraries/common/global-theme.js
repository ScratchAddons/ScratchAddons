// Theme system is using 4 variables:
// themeSetting - it stores current selected setting (light, dark, auto, time)
// themeStatus - updateTheme() function sets it to true or false
// themeTimeInputValue - it stores sunset and sunrise setting (for example 08:00-20:00)
// syncAddonsWithTheme - it stores setting which is used to change status of addons

// Create link that adds light/dark style
const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", chrome.runtime.getURL("/webpages/styles/colors-light.css"));
lightThemeLink.setAttribute("data-below-vue-components", "");
lightThemeLink.media = "not all";
document.head.appendChild(lightThemeLink);

updateTheme();

// Add event listeners that detects theme change (theme change or time change)
chrome.storage.sync.get(["themeSetting"], ({ themeSetting = null }) => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (themeSetting !== "auto") {
      return;
    }
    updateTheme();
  });
  setInterval(function () {
    if (themeSetting !== "time") {
      return;
    }
    updateTheme();
  }, 60000);
});

function updateTheme() {
  chrome.storage.sync.get(
    ["themeSetting", "themeStatus", "themeTimeInputValue", "syncAddonsWithTheme", "globalTheme"],
    ({
      themeSetting = null,
      themeStatus = null,
      themeTimeInputValue = null,
      syncAddonsWithTheme = null,
      globalTheme = true,
    }) => {
      if (themeSetting == null) {
        themeSetting = globalTheme ? "light" : "dark";
        chrome.storage.sync.set({ themeSetting: themeSetting });
        chrome.storage.sync.remove(["globalTheme"]);
      }
      let _themeStatus;
      switch (themeSetting) {
        case "light":
          _themeStatus = true;
          break;
        case "dark":
          _themeStatus = false;
          break;
        case "auto":
          _themeStatus = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
          break;
        case "time":
          let [timeSunrise, timeSunset] = themeTimeInputValue.split("-");

          let timeSunriseSplit = timeSunrise.split(":");
          let timeSunriseMinutes = parseInt(timeSunriseSplit[0] * 60) + parseInt(timeSunriseSplit[1]);

          let timeSunsetSplit = timeSunset.split(":");
          let timeSunsetMinutes = parseInt(timeSunsetSplit[0] * 60) + parseInt(timeSunsetSplit[1]);

          let date = new Date();
          let currentTime = date.getHours() * 60 + date.getMinutes();
          _themeStatus = timeSunriseMinutes <= currentTime && currentTime <= timeSunsetMinutes;
          break;
        default:
          _themeStatus = false;
          console.error("Unexpected theme: " + themeSetting);
      }

      let previousThemeStatus = themeStatus;
      chrome.storage.sync.set({ themeStatus: _themeStatus });

      if (_themeStatus) {
        lightThemeLink.removeAttribute("media");
      } else {
        lightThemeLink.media = "not all";
      }
      if ((themeSetting == "auto" || themeSetting == "time") && syncAddonsWithTheme) {
        if (previousThemeStatus == _themeStatus) {
          return;
        }
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: "dark-www", newState: !_themeStatus } });
        chrome.runtime.sendMessage({ changeEnabledState: { addonId: "editor-dark-mode", newState: !_themeStatus } });
      }
    }
  );
}

export default function () {
  const prerelease = chrome.runtime.getManifest().version_name.includes("-prerelease");
  if (prerelease) {
    const blue = getComputedStyle(document.documentElement).getPropertyValue("--blue");
    document.documentElement.style.setProperty("--brand-orange", blue);
    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = chrome.runtime.getURL("/images/icon-blue.png");
  }
  return new Promise((resolve) => {
    chrome.storage.sync.get(["themeSetting", "themeStatus"], ({ themeStatus = true, themeSetting = "light" }) => {
      resolve({
        theme: themeSetting,
        setGlobalTheme(currentSetting) {
          chrome.storage.sync.set({ themeSetting: currentSetting });
          updateTheme();
        },
      });
    });
  });
}
