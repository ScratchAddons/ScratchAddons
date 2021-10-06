/* global __scratchAddonsChrome: writable */
import createConsole from "./console.js";

window.__scratchAddonsChrome = {
  listenersReady: false,
  nextMsgId: 0,
  manifest: undefined,
  messages: undefined,
  ...(window.__scratchAddonsChrome || {}),
};

function waitForListeners() {
  return new Promise(function (resolve, reject) {
    if (__scratchAddonsChrome.listenersReady) return resolve();
    const listener = (e) => {
      if (
        (e.source === window || e.source === window.top || e.source === window.parent) &&
        e.data === "listeners ready"
      ) {
        __scratchAddonsChrome.listenersReady = true;
        resolve();
        window.removeEventListener("message", listener);
      }
    };
    window.addEventListener("message", listener);
    window.parent.postMessage({ message: "areListenersReady" }, "*");
  });
}
const console = createConsole("chrome");

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

function sendMessage(message, callback) {
  waitForListeners().then(() => {
    const id = __scratchAddonsChrome.nextMsgId++;
    window.parent.postMessage({ id, message }, "*");
    if (callback) {
      const listener = (event) => {
        if (event.source === window.parent && event.data.reqId === id + "r") {
          window.removeEventListener("message", listener);
          callback(event.data.res);
        }
      };
      window.addEventListener("message", listener);
    }
  });
}

export default {
  ...(window.browser || {}),
  ...(window.chrome || {}),
  pollyfilled: true,
  storage: { sync: storage, local: storage },
  runtime: {
    async getManifest() {
      if (__scratchAddonsChrome.manifest) return __scratchAddonsChrome.manifest;
      const response = await fetch(getURL("manifest.json"));
      return (__scratchAddonsChrome.manifest = await response.json());
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
    ready: !!__scratchAddonsChrome.messages,
    async init() {
      if (!__scratchAddonsChrome.messages) {
        const ui = navigator.language.toLowerCase().split("-");

        // Start with the chosen language
        const locales = [ui[0] + (ui[1] ? "_" + ui[1].toUpperCase() : "")];

        // Remove country code
        if (ui[1]) locales.push(ui[0]);

        // If non-Brazillian Portugese is chosen, add Brazilian as a fallback.
        if (ui[0] === "pt" && ui[1] !== "br") locales.push("pt_BR");

        // Add English as a fallback
        if (!locales.includes("en")) locales.push("en");
        locales.splice(locales.indexOf("en") + 1);

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

        __scratchAddonsChrome.messages = Object.assign({}, ...(await Promise.all(localePromises)));
      }
      this.ready = true;
    },
    getUILanguage() {
      return navigator.language;
    },
    getMessage(message, placeholders = []) {
      if (!this.ready)
        throw new ReferenceError("Call `await .i18n.init()` before `.i18n.getMessage(message, placeholders)`!");
      if (typeof placeholders === "string") placeholders = [placeholders];

      return __scratchAddonsChrome.messages[message].message
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

function getURL(url) {
  const { href } = new URL("../../" + url, import.meta.url);
  return href;
}
