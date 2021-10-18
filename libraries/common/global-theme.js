export default function () {
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "../styles/colors-light.css");
  lightThemeLink.setAttribute("data-below-vue-components", "");
  return new Promise((resolve) => {
    chrome.storage.sync.get(["globalTheme"], ({ globalTheme = false }) => {
      if (globalTheme === true) {
        document.head.appendChild(lightThemeLink);
      }
      resolve(globalTheme);
    });
  });
}
