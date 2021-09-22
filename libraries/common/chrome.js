const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const storage = {
  get(keys, callback) {
    return Promise.all(
      keys.map(async (key) => {
        const res = await promisify(sendMessage)({ getFromStorage: key });
        return [
          key,
          typeof res === "string"
            ? JSON.parse(res === "undefined" || res === "" || res.startsWith("[object") ? null : res)
            : res,
        ];
        // localStorage[key]
      })
    ).then((res) => callback(Object.fromEntries(res)));
  },
  set(keys, callback = () => {}) {
    return Promise.all(
      Object.entries(keys).map(
        async ([key, value]) => await promisify(sendMessage)({ setInStorage: [key, value] })
        // localStorage[key] = JSON.stringify(value);
      )
    ).then(() => callback());
  },
};

function sendMessage(message, callback = () => {}) {
  window.parent.postMessage(message, "*"); // todo not *
  const listener = (event) => {
    if (event.source === window.parent&&event.data.original ===message) {
      window.removeEventListener("message", listener);
      callback(event.data);
    }
  };
  window.addEventListener("message", listener);
}
let manifest;

export default {
  storage: { sync: storage, local: storage },
  runtime: {
    async getManifest() {
      if (manifest) return manifest;
      const response = await fetch(getURL("manifest.json"));
      return (manifest = await response.json());
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

function getURL(url, min = false) {
  // todo min true
  const { href } = new URL("../../" + url, import.meta.url);
  return min ? href.replace(/(?<!\.min)\.js$/, ".min.js").replace(/(?<!\.min)\.css$/, ".min.css") : href;
}
