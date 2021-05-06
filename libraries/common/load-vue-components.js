export default function (arr) {
  return new Promise(async (resolve, reject) => {
    const promises = [];
    for (const pathWithoutExtension of arr) {
      const htmlUrl = chrome.runtime.getURL(`${pathWithoutExtension}.html`);
      const jsUrl = chrome.runtime.getURL(`${pathWithoutExtension}.js`);
      const jsPromise = import(jsUrl);
      const htmlPromise = fetch(htmlUrl)
        .then((res) => res.text())
        .then(async (text) => {
          const dom = new DOMParser().parseFromString(text, "text/html");
          const template = dom.querySelector("template").innerHTML;
          const jsModule = await jsPromise;
          jsModule.default({ template });
        })
        .catch((err) => reject(err));
      promises.push(jsPromise, htmlPromise);
    }
    await Promise.all(promises);
    resolve();
  });
}
