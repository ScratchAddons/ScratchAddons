import runAddonUserscripts from "./run-userscript.js";
import Localization from "./l10n.js";

const template = document.getElementById("scratch-addons");
const getGlobalState = () => {
  const returnValue = JSON.parse(template.getAttribute("data-global-state"));
  template.removeAttribute("data-global-state");
  return returnValue;
};

const getL10NURLs = () => {
  const returnValue = JSON.parse(template.getAttribute("data-l10njson"));
  template.removeAttribute("data-l10njson");
  return returnValue;
};

const addons = JSON.parse(template.getAttribute("data-userscripts"));

window.scratchAddons = {};
scratchAddons.globalState = getGlobalState();
scratchAddons.l10n = new Localization(getL10NURLs());
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
  self: [],
};
scratchAddons.classNames = { loaded: false };

const pendingPromises = {};
pendingPromises.msgCount = [];

scratchAddons.methods = {};
scratchAddons.methods.getMsgCount = () => {
  template.setAttribute(`data-request-msgcount__${Date.now()}`, "");
  let promiseResolver;
  const promise = new Promise((resolve) => (promiseResolver = resolve));
  pendingPromises.msgCount.push(promiseResolver);
  return promise;
};

function bodyIsEditorClassCheck() {
  const pathname = location.pathname.toLowerCase();
  const split = pathname.split("/").filter(Boolean);
  if (!split[0] || split[0] !== "projects") return;
  if (split.includes("editor") || split.includes("fullscreen")) document.body.classList.add("sa-body-editor");
  else document.body.classList.remove("sa-body-editor");
}
if (!document.body) document.addEventListener("DOMContentLoaded", bodyIsEditorClassCheck);
else bodyIsEditorClassCheck();

const originalReplaceState = history.replaceState;
history.replaceState = function () {
  const oldUrl = location.href;
  const newUrl = new URL(arguments[2], document.baseURI).href;
  const returnValue = originalReplaceState.apply(history, arguments);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

const originalPushState = history.pushState;
history.pushState = function () {
  const oldUrl = location.href;
  const newUrl = new URL(arguments[2], document.baseURI).href;
  const returnValue = originalPushState.apply(history, arguments);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
  bodyIsEditorClassCheck();
  return returnValue;
};

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    const attr = mutation.attributeName;
    const attrType = attr.substring(0, attr.indexOf("__"));
    const attrRawVal = template.getAttribute(attr);
    let attrVal;
    try {
      attrVal = JSON.parse(attrRawVal);
    } catch (err) {
      attrVal = attrRawVal;
    }
    if (attrVal === null) return;
    const removeAttr = () => template.removeAttribute(attr);
    if (attr === "data-global-state") scratchAddons.globalState = getGlobalState();
    else if (attr === "data-msgcount") {
      pendingPromises.msgCount.forEach((promiseResolver) => promiseResolver(attrVal));
      pendingPromises.msgCount = [];
      removeAttr();
    } else if (attrType === "data-fire-event") {
      if (attrVal.addonId) {
        const settingsEventTarget = scratchAddons.eventTargets.settings.find(
          (eventTarget) => eventTarget._addonId === attrVal.addonId
        );
        if (settingsEventTarget) settingsEventTarget.dispatchEvent(new CustomEvent("change"));
      } else
        scratchAddons.eventTargets[attrVal.target].forEach((eventTarget) =>
          eventTarget.dispatchEvent(new CustomEvent(attrVal.name))
        );
      removeAttr();
    }
  }
});
observer.observe(template, { attributes: true });

for (const addon of addons) {
  if (addon.scripts.length) runAddonUserscripts(addon);
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
}

if (document.querySelector("title")) loadClasses();
else {
  const stylesObserver = new MutationObserver((mutationsList) => {
    if (document.querySelector("title")) {
      stylesObserver.disconnect();
      loadClasses();
    }
  });
  stylesObserver.observe(document.head, { childList: true });
}
