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
          let parsed = new DOMParser().parseFromString(text, "text/html");
          let style = parsed.querySelector("style");
          if (style) document.head.append(style);
          return parse.querySelector("template").innerHTML)
          })
        .then((template) => jsPromise.then((esm) => esm.default({ template })));
    })
  );
