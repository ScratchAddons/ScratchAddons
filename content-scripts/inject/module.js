import runAddonUserscripts from "./run-userscript.js";

const template = document.getElementById("scratch-addons");
const getGlobalState = () => {
  const returnValue = JSON.parse(template.getAttribute("data-global-state"));
  template.removeAttribute("data-global-state");
  return returnValue;
};

window.scratchAddons = {};
scratchAddons.globalState = getGlobalState();
scratchAddons.eventTargets = {
  auth: [],
  settings: [],
  tab: [],
};

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

const originalReplaceState = history.replaceState;
history.replaceState = function () {
  const oldUrl = location.href;
  const newUrl = new URL(arguments[2], document.baseURI).href;
  const returnValue = originalReplaceState.apply(history, arguments);
  for (const eventTarget of scratchAddons.eventTargets.tab) {
    eventTarget.dispatchEvent(new CustomEvent("urlChange", { detail: { oldUrl, newUrl } }));
  }
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

for (const addon of JSON.parse(template.getAttribute("data-userscripts"))) {
  if (addon.scripts.length) runAddonUserscripts(addon);
}
