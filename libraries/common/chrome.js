/* global nextMsgId: writable */

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const storage = {
  get(keys, callback) {
    return Promise.all(
      keys.map(async (key) => {
        // localStorage[key]
        const res = await promisify(sendMessage)({ getFromStorage: key });
        return [
          key,
          typeof res === "string"
            ? JSON.parse(res === "undefined" || res === "" || res.startsWith("[object") ? null : res)
            : res,
        ];
      })
    ).then((res) => callback(Object.fromEntries(res)));
  },
  async set(keys, callback = () => {}) {
    await Promise.all(
      Object.entries(keys).map(
        async ([key, value]) => await promisify(sendMessage)({ setInStorage: [key, value] })
        // localStorage[key] = JSON.stringify(value);
      )
    );
    return callback();
  },
};

window.nextMsgId = window.nextMsgId || 0;

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

const ui = navigator.language.toLowerCase();
const locales = [ui];
if (ui.includes("-")) locales.push(ui.split("-")[0]);
if (ui.startsWith("pt") && ui !== "pt-br") locales.push("pt-br");
if (!locales.includes("en")) locales.push("en");
locales.splice(locales.indexOf("en") + 1);

let messages = {};

export default {
  chrome,
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
      const localePromises = locales
        .map((locale) => {
          let res;
          return fetch(getURL("_locales/" + locale + "/messages.json"))
            .then((resp) => {
              res = resp;
              return resp.json();
            })
            .catch((e) => {
              if (res?.status !== 404) console.error(e);
            });
        })
        .reverse();

      messages = Object.assign({}, ...(await Promise.all(localePromises)));
      window.dispatchEvent(new CustomEvent(".i18n load"));
      this.ready = true;
    },
    getUILanguage() {
      return navigator.language;
    },
    getMessage(message, placeholders = []) {
      if (!this.ready)
        throw new ReferenceError("Call `await .i18n.init()` before `.i18n.getMessage(message, placeholders)`!");
      if (typeof placeholders === "string") placeholders = [placeholders];

      return messages[message].message
        .replace(/\$(\d+)/g, (_, dollar) => placeholders[dollar - 1])
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/['`‘]/g, "&#8217;")
        .replace(/\.{3}/g, "…");
    },
  },
};

function getURL(url, min = false) {
  // todo min true
  const { href } = new URL("../../" + url, import.meta.url);
  return min ? href.replace(/(?<!\.min)\.js$/, ".js").replace(/(?<!\.min)\.css$/, ".css") : href;
}
