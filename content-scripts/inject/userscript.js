import runAddonUserscripts from "./run-userscript.js";

window.scratchAddons = {};
scratchAddons.classNames = { loaded: false };
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
  self: [],
};
scratchAddons.session = {};
const consoleOutput = (logAuthor = "[page]") => {
  const style = {
    // Remember to change these as well on cs.js
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};
scratchAddons.console = {
  log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
  warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
  error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
  logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
  warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
  errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
};

const getSession = {
  isFetching: false,
  async refetchSession() {
    let res;
    let d;
    if (this.isFetching) return;
    this.isFetching = true;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._refresh());
    try {
      res = await fetch("https://scratch.mit.edu/session/", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      d = await res.json();
    } catch (e) {
      d = {};
      scratchAddons.console.warn("Session fetch failed: ", e);
      if ((res && !res.ok) || !res) setTimeout(() => this.refetchSession(), 60000);
    }
    scratchAddons.session = d;
    scratchAddons.eventTargets.auth.forEach((auth) => auth._update(d));
    this.isFetching = false;
  },
};
function onDataReady() {
  const addons = page.addonsWithUserscripts;

  scratchAddons.l10n = new Localization(page.l10njson);

  scratchAddons.methods = {};
  scratchAddons.methods.getMsgCount = () => {
    let promiseResolver;
    const promise = new Promise((resolve) => (promiseResolver = resolve));
    pendingPromises.msgCount.push(promiseResolver);
    // 1 because the array was just pushed
    if (pendingPromises.msgCount.length === 1) requestMsgCount();
    return promise;
  };
  scratchAddons.methods.copyImage = async (dataURL) => {
    return _cs_.copyImage(dataURL);
  };
  scratchAddons.methods.getEnabledAddons = (tag) => _cs_.getEnabledAddons(tag);

  scratchAddons.sharedObserver = new SharedObserver();

  const runUserscripts = () => {
    for (const addon of addons) {
      if (addon.scripts.length) runAddonUserscripts(addon);
    }
  };

  // Note: we currently load userscripts and locales after head loaded
  // We could do that before head loaded just fine, as long as we don't
  // actually *run* the addons before document.head is defined.
  if (document.head) runUserscripts();
  else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        runUserscripts();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { subtree: true, childList: true });
  }
}

function loadClasses() {
  scratchAddons.classNames.arr = [
    ...new Set(
      [...document.styleSheets]
        .filter(
          (styleSheet) =>
            !(
              styleSheet.ownerNode.textContent.startsWith(
                "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
              ) &&
              (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                styleSheet.ownerNode.textContent.includes("label_input-group_"))
            )
        )
        .map((e) => {
          try {
            return [...e.cssRules];
          } catch (e) {
            return [];
          }
        })
        .flat()
        .map((e) => e.selectorText)
        .filter((e) => e)
        .map((e) => e.match(/(([\w-]+?)_([\w-]+)_([\w\d-]+))/g))
        .filter((e) => e)
        .flat()
    ),
  ];
  scratchAddons.classNames.loaded = true;

  const fixPlaceHolderClasses = () =>
    document.querySelectorAll("[class*='scratchAddonsScratchClass/']").forEach((el) => {
      [...el.classList]
        .filter((className) => className.startsWith("scratchAddonsScratchClass"))
        .map((className) => className.substring(className.indexOf("/") + 1))
        .forEach((classNameToFind) =>
          el.classList.replace(
            `scratchAddonsScratchClass/${classNameToFind}`,
            scratchAddons.classNames.arr.find(
              (className) =>
                className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
            ) || `scratchAddonsScratchClass/${classNameToFind}`
          )
        );
    });

  fixPlaceHolderClasses();
  new MutationObserver(() => fixPlaceHolderClasses()).observe(document.documentElement, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

if (document.querySelector("title")) loadClasses();
else {
  const stylesObserver = new MutationObserver(() => {
    if (document.querySelector("title")) {
      stylesObserver.disconnect();
      loadClasses();
    }
  });
  stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function loadScriptFromUrl(url) {
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement("script"), {
      src: new URL(url, import.meta.url).href,
    });
    script.addEventListener("load", () => {
      resolve();
    });
    document.body.append(script);
  });
}

await Promise.all([
  loadScriptFromUrl("../../libraries/common/cs/text-color.js"),
  loadScriptFromUrl("../prototype-handler.js"),
  loadScriptFromUrl("../load-redux.js"),
  loadScriptFromUrl("../fix-console.js"),
]);

const addons = (await fetch(new URL("../../addons/addons.json", import.meta.url).href).then((r) => r.json())).filter(
  (addon) => !addon.startsWith("//")
);
onDataReady();
getSession.refetchSession();
addons.forEach(async (addonId) => {
  const manifest = await fetch(new URL("../../addons/" + addonId + "/addon.json", import.meta.url).href).then((r) =>
    r.json()
  );
  runAddonUserscripts({ addonId, scripts: manifest.scripts });
});
