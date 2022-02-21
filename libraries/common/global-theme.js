export default function () {
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", chrome.runtime.getURL("/webpages/styles/colors-light.css"));
  lightThemeLink.setAttribute("data-below-vue-components", "");
  lightThemeLink.media = "not all";
  document.head.appendChild(lightThemeLink);
  return new Promise((resolve) => {
    chrome.storage.sync.get(["globalTheme"], ({ globalTheme = false }) => {
      // true = light, false = dark, auto = system theme, time = values preseted
      
      if (globalTheme == "auto") {
        updateTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
          if (globalTheme !== "auto") { return };
          updateTheme((!(event.matches)));
          const newState = event.matches;
          chrome.runtime.sendMessage({ changeEnabledState: { addonId: "dark-www", newState } });
          chrome.runtime.sendMessage({ changeEnabledState: { addonId: "editor-dark-mode", newState } });
          updateTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        });
      }
      
      if (globalTheme == "time") {
        var tickTimeCheck = setInterval(function() {
          if (globalTheme !== "time") { return };
          getTime()
        }, 60000);
        getTime();
      }

      let theme;
      
      resolve({
        theme: globalTheme,
        setGlobalTheme(mode) {
          if (mode == theme) return;
          chrome.storage.sync.set({ globalTheme: mode }, () => {
            let tempMode;
            if (mode == 'auto')
              tempMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
            else if (mode == 'time') {
              updateTheme(mode);
              tempMode = timeStatus;
            } else { tempMode = mode}
            theme = tempMode;
            updateTheme(tempMode);
          });
        },
      });
    });
  });
  
  async function updateAddons(state) {
    const themeSyncAddons = await new Promise((resolve, reject) => chrome.storage.sync.get(['themeSyncAddons'], result => resolve(result.themeSyncAddons)));
    if (themeSyncAddons) {
      const addonWWW = await chrome.runtime.sendMessage({ changeEnabledState: { addonId: "dark-www", state } });
      const addonEditor = await chrome.runtime.sendMessage({ changeEnabledState: { addonId: "editor-dark-mode", state } });
    };
  };
  
  async function getTime() {
    // Add chrome messages and if about turning off and on addons...
    let timeInputOne = await new Promise((resolve, reject) => chrome.storage.sync.get(['timeOne'], result => resolve(result.timeOne)));
    let timeInputTwo = await new Promise((resolve, reject) => chrome.storage.sync.get(['timeTwo'], result => resolve(result.timeTwo)));
    let timeOneSplit = timeInputOne.split(":");
    const timeOne = parseInt((timeOneSplit[0] * 60)) + parseInt(timeOneSplit[1])
    let timeTwoSplit = timeInputTwo.split(":");
    const timeTwo = parseInt((timeTwoSplit[0] * 60)) + parseInt(timeTwoSplit[1])
    let date = new Date();
    let currentTime = (date.getHours() * 60) + date.getMinutes();
    const timeStatus = (timeOne <= currentTime && currentTime <= timeTwo);
    updateTheme(timeStatus);
  };
        
  function updateTheme(mode) {
    if (mode === true) {
      lightThemeLink.removeAttribute("media");
    } else {
      lightThemeLink.media = "not all";
    }
    updateAddons(mode);
  }
}
