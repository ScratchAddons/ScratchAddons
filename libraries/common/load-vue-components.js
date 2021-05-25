const styles = {};

/**
 * Loads Vue components.
 * @param {string[]} filenames - filenames of the components, without extensions.
 * @returns {Promise}
 */
export default (filenames) =>
  Promise.all(
    filenames.map((filename) => {
      const htmlUrl = chrome.runtime.getURL(`${filename}.html`);
      const jsUrl = chrome.runtime.getURL(`${filename}.js`);
      const jsPromise = import(jsUrl);
      return fetch(htmlUrl)
        .then((resp) => resp.text())
        .then((text) => {
          const dom = new DOMParser().parseFromString(text, "text/html");
          styles[filename] = dom.querySelector("style");
          return dom.querySelector("template").innerHTML;
        })
        .then((template) => jsPromise.then((esm) => esm.default({ template })));
    })
  ).then(() => filenames.forEach((filename) => styles[filename] && document.head.appendChild(styles[filename])));
