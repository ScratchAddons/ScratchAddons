export default function () {
  const prerelease = chrome.runtime.getManifest().version_name.includes("-prerelease");
  if (prerelease) {
    const blue = getComputedStyle(document.documentElement).getPropertyValue("--blue");
    document.documentElement.style.setProperty("--brand-orange", blue);
    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = chrome.runtime.getURL("/images/icon-blue.png");
  }
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", chrome.runtime.getURL("/webpages/styles/colors-light.css"));
  lightThemeLink.setAttribute("data-below-vue-components", "");
  lightThemeLink.media = "not all";
  document.head.appendChild(lightThemeLink);
  return new Promise((resolve) => {
    chrome.storage.sync.get(["globalTheme"], ({ globalTheme = false }) => {
      // true = light, false = dark
      if (globalTheme === true) {
        lightThemeLink.removeAttribute("media");
      }
      let theme = globalTheme;
      resolve({
        theme: globalTheme,
        setGlobalTheme(mode) {
          if (mode === theme) return;
          chrome.storage.sync.set({ globalTheme: mode }, () => {
            if (mode === true) {
              lightThemeLink.removeAttribute("media");
            } else {
              lightThemeLink.media = "not all";
            }
          });
          theme = mode;
        },
      });
    });
  });
}
