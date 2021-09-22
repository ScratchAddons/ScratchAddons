/* global nextMsgId: writable */

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const storage = {
  async get(keys, callback) {
    const res_1 = await Promise.all(
      keys.map(async (key) => {
        const res = await promisify(sendMessage)({ getFromStorage: key });
        return [
          key,
          typeof res === "string"
            ? JSON.parse(res === "undefined" || res === "" || res.startsWith("[object") ? null : res)
            : res,
        ];
      })
    );
    return callback(Object.fromEntries(res_1));
  },
  async set(keys, callback = () => {}) {
    await Promise.all(
      Object.entries(keys).map(
        async ([key, value_1]) => await promisify(sendMessage)({ setInStorage: [key, value_1] })
        // localStorage[key] = JSON.stringify(value);
      )
    );
    return callback();
  },
};

window.nextMsgId = 0;

function sendMessage(message, callback = () => {}) {
  const id = nextMsgId++;
  window.parent.postMessage({ id, message }, "*"); // todo not *
  const listener = (event) => {
    if (event.source === window.parent && event.data.reqId === id + "r") {
      window.removeEventListener("message", listener);
      callback(event.data.res);
    }
  };
  window.addEventListener("message", listener);
}
let manifest;

const ui = chrome.i18n.getUILanguage().toLowerCase();
const locales = [ui];
if (ui.includes("-")) locales.push(ui.split("-")[0]);
if (ui.startsWith("pt") && ui !== "pt-br") locales.push("pt-br");
if (!locales.includes("en")) locales.push("en");
locales.splice(locales.indexOf("en") + 1);

let messages = {};

export default {
  storage: { sync: storage, local: storage },
  runtime: {
    async getManifest() {
      if (manifest) return manifest;
      const response = await fetch(getURL("manifest.json"));
      return (manifest = await response.json());
    },
    reload() {
      location.reload();
    },
    getURL,
    sendMessage,
    lastError: undefined,
    openOptionsPage() {
      sendMessage({ updatePageUrl: "https://scratch.mit.edu/scratch-addons-extention/settings" });
      window.location.href = "https://scratch.mit.edu/scratch-addons-extention/settings";
    },
  },
  i18n: {
    ready: false,
    async init() {
      const localePromises = locales.map(async (locale) => {
        const r = await fetch(getURL("_locales/" + locale + "/messages.json"));
        return await r.json();
      });

      messages = Object.assign({}, ...(await Promise.all(localePromises).reverse()));
      window.dispatchEvent(new CustomEvent("chrome.i18n load"));
      this.ready = true;
    },
    getUILanguage() {
      return navigator.language;
    },
    getMessage(message, placeholders = []) {
      if (!this.ready)
        throw new ReferenceError("Call `await chrome.i18n.init()` before `getMessage(message, placeholders)`!");
      if (typeof placeholders === "string") placeholders = [placeholders];
      return messages[message];
    },
  },
};

function getURL(url, min = false) {
  // todo min true
  const { href } = new URL("../../" + url, import.meta.url);
  return min ? href.replace(/(?<!\.min)\.js$/, ".min.js").replace(/(?<!\.min)\.css$/, ".min.css") : href;
}
