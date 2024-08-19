import { getGlobalTheme, setGlobalTheme, versionName } from "./settings-page-apis.js";

export default async function () {
  const prerelease = versionName.includes("-prerelease");
  if (prerelease) {
    // TODO: this could be a togglable class
    const blue = getComputedStyle(document.documentElement).getPropertyValue("--blue");
    document.documentElement.style.setProperty("--brand-orange", blue);
    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = "/images/icon-blue.png";
  }
  // TODO: this could be moved to html.
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "/webpages/styles/colors-light.css");
  lightThemeLink.setAttribute("data-below-vue-components", "");
  lightThemeLink.media = "not all";
  document.head.appendChild(lightThemeLink);
  const globalTheme = await getGlobalTheme();
  // true = light, false = dark
  if (globalTheme === true) {
    lightThemeLink.removeAttribute("media");
  }
  // TODO: is this right?
  let theme = globalTheme;
  return {
    theme: globalTheme,
    setGlobalTheme(mode) {
      if (mode === theme) return;
      setGlobalTheme(mode, () => {
        if (mode === true) {
          lightThemeLink.removeAttribute("media");
        } else {
          lightThemeLink.media = "not all";
        }
      });
      theme = mode;
    },
  };
}
