export default function () {
  const prerelease = chrome.runtime.getManifest().version_name.includes("-prerelease");
  if (prerelease) {
    const blue = getComputedStyle(document.documentElement).getPropertyValue("--blue");
    document.documentElement.style.setProperty("--brand-orange", blue);
    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = chrome.runtime.getURL("/images/icon-blue.png");
  }
  const now = Date.now() / 1000;
  if (now < 1743595200 && now > 1743422400 && ["settings", "popup"].includes(location.pathname.split("/")[2])) {
    // March 31, 2025 12:00:00 GMT to April 2, 2025 12:00:00 GMT
    document.documentElement.style.setProperty("--brand-orange", "#6c503c");
    // https://www.deviantart.com/fabooguy/art/Dirt-Ground-Texture-Tileable-2048x2048-441212191
    document.documentElement.style.setProperty("--dirt-background", "url('../../images/dirt.jpg')");
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
