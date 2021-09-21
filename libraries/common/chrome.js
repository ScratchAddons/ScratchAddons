const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const storage = {
  get(keys, callback) {
    return callback(
      Object.fromEntries(
        keys.map((key) => {
          return [key, JSON.parse(promisify(sendMessage)({ getFromStorage: key }))];
          // localStorage[key]
        })
      )
    );
  },
  set(keys, callback) {
    return callback(
      Object.entries(keys).forEach(([key, value]) => {
        promisify(sendMessage)({ setInStorage: [key, value] });
        // localStorage[key] = JSON.stringify(value);
      })
    );
  },
};

function sendMessage(message, callback = () => {}) {
  window.parent.postMessage({ message, callback }, "*");
}
export default {
  storage: { sync: storage, local: storage },
  runtime: {
    async getManifest() {
      const response = await fetch(getURL("manifest.json"));
      return await response.json();
    },
    reload() {},
    getURL,
    sendMessage,
    lastError: undefined,
    openOptionsPage() {
      sendMessage({ updatePageUrl: "https://scratch.mit.edu/scratch-addons-extention/settings" });
      window.location.href = "https://scratch.mit.edu/scratch-addons-extention/settings";
    },
  },
  i18n: {
    getUILanguage() {
      return navigator.language;
    },
    getMessage() {
      return "Not implemented yet";
    },
  },
};

function getURL(url) {
  return new URL("../../" + url, import.meta.url).href
    .replace(/(?<!\.min)\.js$/, ".min.js")
    .replace(/(?<!\.min)\.css$/, ".min.css");
}
