/**
 * Loads Vue components.
 * @param {string[]} filenames - filenames of the components, without extensions.
 * @returns {Promise}
 */
const loadVueComponents = (filenames) =>
  Promise.all(
    filenames.map((filename) => {
      let params = filename.params || {};
      filename = filename.url || filename;
      const [componentName] = filename.split("/").slice(-1);
      const htmlUrl = chrome.runtime.getURL(`${filename}.html`);
      const jsUrl = chrome.runtime.getURL(`${filename}.js`);
      const jsPromise = import(jsUrl);
      return fetch(htmlUrl)
        .then((resp) => resp.text())
        .then((text) => {
          const dom = new DOMParser().parseFromString(text, "text/html");

          let css = dom.querySelector("style");
          if (css) {
            if (chrome.runtime.getManifest().version_name.includes("-prerelease")) {
              const normalizedCss = css.textContent.replace("\n", "").trimEnd();
              const normalizedText = text.replace(/\r/g, "");
              const cssFirstLine = normalizedCss.substring(0, normalizedCss.indexOf("\n"));
              const linesToAdd = normalizedText.split("\n").findIndex((line) => line === cssFirstLine);
              const newLines = Object.assign(Array(linesToAdd), {
                0: "/*",
                [linesToAdd - 1]: "<style> */",
              }).join("\n");
              css.textContent = `${newLines}\n${normalizedCss}/* \n</style> */\n/*# sourceURL=${htmlUrl} */`;
            }
            css.setAttribute("data-vue-component", componentName); // For debugging (has no side effects)
            // Add data-addon-id - used by the popup to disable styles from inactive tabs
            if (filename.startsWith("popups/")) {
              const [addonId] = filename.split("/").slice(1);
              css.setAttribute("data-addon-id", addonId);
            } else if (filename.startsWith("webpages/settings/")) {
              css.setAttribute("data-addon-id", "settings-page");
            }
            document.head.insertBefore(css, document.head.querySelector("[data-below-vue-components]"));
          }
          return dom.querySelector("template").innerHTML;
        })
        .then((template) =>
          jsPromise.then(async ({ default: details }) => {
            details.mixins = details.mixins ?? [];
            details.mixins.push({
              name: componentName,
              template,
              data: () => params,
            });
            if (details.components) {
              details.components = await loadVueComponents(details.components);
            }
            return Vue.extend(details);
          })
        );
    })
  );

export default loadVueComponents;
