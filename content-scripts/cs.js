let shouldRun = true;

try {
  if (window.parent.location.origin !== "https://scratch.mit.edu") throw "Scratch Addons: not first party iframe";
} catch {
  throw "Scratch Addons: not first party iframe";
}
if (document.documentElement instanceof SVGElement) {
  shouldRun = false; // Other content scripts shouldn't run
  throw "Top-level SVG document (this can be ignored)";
}

queueMicrotask(() => {
  import(chrome.runtime.getURL("/content-scripts/update-banner.js"));
  import(chrome.runtime.getURL("/content-scripts/comment-filter.js"));
  import(chrome.runtime.getURL("/content-scripts/forum-warning.js"));
});

let pseudoUrl; // Fake URL to use if response code isn't 2xx

let receivedResponse = false;
const onMessageBackgroundReady = (request, sender, sendResponse) => {
  if (request === "backgroundListenerReady" && !receivedResponse) {
    chrome.runtime.sendMessage({ contentScriptReady: { url: location.href } }, onResponse);
  }
};
chrome.runtime.onMessage.addListener(onMessageBackgroundReady);
const onResponse = (res) => {
  if (res && !receivedResponse) {
    console.log("[Message from background]", res);
    chrome.runtime.onMessage.removeListener(onMessageBackgroundReady);
    if (res.httpStatusCode === null || String(res.httpStatusCode)[0] === "2") {
      onInfoAvailable(res);
      receivedResponse = true;
    } else {
      pseudoUrl = `https://scratch.mit.edu/${res.httpStatusCode}/`;
      console.log(`Status code was not 2xx, replacing URL to ${pseudoUrl}`);
      chrome.runtime.sendMessage({ contentScriptReady: { url: pseudoUrl } }, onResponse);
    }
  }
};
chrome.runtime.sendMessage({ contentScriptReady: { url: location.href } }, onResponse);

let _page_ = null;
let globalState = null;

const comlinkIframesDiv = document.createElement("div");
comlinkIframesDiv.id = "scratchaddons-iframes";
const comlinkIframe1 = document.createElement("iframe");
comlinkIframe1.id = "scratchaddons-iframe-1";
comlinkIframe1.style.display = "none";
const comlinkIframe2 = comlinkIframe1.cloneNode();
comlinkIframe2.id = "scratchaddons-iframe-2";
const comlinkIframe3 = comlinkIframe1.cloneNode();
comlinkIframe3.id = "scratchaddons-iframe-3";
const comlinkIframe4 = comlinkIframe1.cloneNode();
comlinkIframe4.id = "scratchaddons-iframe-4";
comlinkIframesDiv.append(comlinkIframe1, comlinkIframe2, comlinkIframe3, comlinkIframe4);
document.documentElement.appendChild(comlinkIframesDiv);

window.csUrlObserver = new EventTarget();
const cs = {
  _url: location.href, // Updated by module.js on calls to history.replaceState/pushState
  get url() {
    return this._url;
  },
  set url(newUrl) {
    this._url = newUrl;
    window.csUrlObserver.dispatchEvent(new CustomEvent("change", { detail: { newUrl } }));
  },
  copyImage(dataURL) {
    // Firefox only
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage({ clipboardDataURL: dataURL }).then(
        (res) => {
          resolve();
        },
        (res) => {
          reject(res.toString());
        }
      );
    });
  },
  getEnabledAddons(tag) {
    // Return addons that are enabled
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          getEnabledAddons: {
            tag,
          },
        },
        (res) => resolve(res)
      );
    });
  },
};
Comlink.expose(cs, Comlink.windowEndpoint(comlinkIframe1.contentWindow, comlinkIframe2.contentWindow));

const pageComlinkScript = document.createElement("script");
pageComlinkScript.src = chrome.runtime.getURL("libraries/thirdparty/cs/comlink.js");
document.documentElement.appendChild(pageComlinkScript);

const moduleScript = document.createElement("script");
moduleScript.type = "module";
moduleScript.src = chrome.runtime.getURL("content-scripts/inject/module.js");

(async () => {
  await new Promise((resolve) => {
    moduleScript.addEventListener("load", resolve);
  });
  _page_ = Comlink.wrap(Comlink.windowEndpoint(comlinkIframe3.contentWindow, comlinkIframe4.contentWindow));
})();

document.documentElement.appendChild(moduleScript);

let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] !== "/") path += "/";
const pathArr = path.split("/");
if (pathArr[0] === "scratch-addons-extension") {
  if (pathArr[1] === "settings") {
    let url = chrome.runtime.getURL(`webpages/settings/index.html${window.location.search}`);
    if (location.hash) url += location.hash;
    chrome.runtime.sendMessage({ replaceTabWithUrl: url });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message from background]", request);
  if (request === "getInitialUrl") {
    sendResponse(pseudoUrl || initialUrl);
  } else if (request === "getLocationHref") {
    sendResponse(location.href);
  }
});

function addStyle(addon) {
  const allStyles = [...document.querySelectorAll(".scratch-addons-style")];
  const addonStyles = allStyles.filter((el) => el.getAttribute("data-addon-id") === addon.addonId);

  const appendByIndex = (el, index) => {
    // Append a style element in the correct place preserving order
    const nextElement = allStyles.find((el) => Number(el.getAttribute("data-addon-index") > index));
    if (nextElement) document.documentElement.insertBefore(el, nextElement);
    else {
      if (document.body) document.documentElement.insertBefore(el, document.body);
      else document.documentElement.appendChild(el);
    }
  };

  for (let userstyle of addon.styles) {
    if (addon.injectAsStyleElt) {
      // If an existing style is already appended, just enable it instead
      const existingEl = addonStyles.find((style) => style.textContent === userstyle);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const style = document.createElement("style");
      style.classList.add("scratch-addons-style");
      style.setAttribute("data-addon-id", addon.addonId);
      style.setAttribute("data-addon-index", addon.index);
      style.textContent = userstyle;
      appendByIndex(style, addon.index);
    } else {
      const existingEl = addonStyles.find((style) => style.href === userstyle);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-addon-id", addon.addonId);
      link.setAttribute("data-addon-index", addon.index);
      link.classList.add("scratch-addons-style");
      link.href = userstyle;
      appendByIndex(link, addon.index);
    }
  }
}
function removeAddonStyles(addonId) {
  // Instead of actually removing the style/link element, we just disable it.
  // That way, if the addon needs to be reenabled, it can just enable that style/link element instead of readding it.
  // This helps with load times for link elements.
  document.querySelectorAll(`[data-addon-id='${addonId}']`).forEach((style) => (style.disabled = true));
}

function injectUserstyles(addonsWithUserstyles) {
  for (const addon of addonsWithUserstyles || []) {
    addStyle(addon);
  }
}

const textColorLib = __scratchAddonsTextColor;
const existingCssVariables = [];
function setCssVariables(addonSettings, addonsWithUserstyles) {
  const hyphensToCamelCase = (s) => s.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const setVar = (addonId, varName, value) => {
    const realVarName = `--${hyphensToCamelCase(addonId)}-${varName}`;
    document.documentElement.style.setProperty(realVarName, value);
    existingCssVariables.push(realVarName);
  };

  const removeVar = (addonId, varName) =>
    document.documentElement.style.removeProperty(`--${hyphensToCamelCase(addonId)}-${varName}`);

  // First remove all CSS variables, we add them all back anyway
  existingCssVariables.forEach((varName) => document.documentElement.style.removeProperty(varName));
  existingCssVariables.length = 0;

  const addonIds = addonsWithUserstyles.map((obj) => obj.addonId);

  // Set variables for settings
  for (const addonId of addonIds) {
    for (const settingName of Object.keys(addonSettings[addonId] || {})) {
      const value = addonSettings[addonId][settingName];
      if (typeof value === "string" || typeof value === "number") {
        setVar(addonId, hyphensToCamelCase(settingName), addonSettings[addonId][settingName]);
      }
    }
  }

  // Set variables for customCssVariables
  const getColor = (addonId, obj) => {
    if (typeof obj !== "object") return obj;
    let hex;
    switch (obj.type) {
      case "settingValue":
        return addonSettings[addonId][obj.settingId];
      case "ternary":
        // this is not even a color lol
        return getColor(addonId, obj.source) ? obj.true : obj.false;
      case "map":
        return obj.options[getColor(addonId, obj.source)];
      case "textColor": {
        hex = getColor(addonId, obj.source);
        let black = getColor(addonId, obj.black);
        let white = getColor(addonId, obj.white);
        let threshold = getColor(addonId, obj.threshold);
        return textColorLib.textColor(hex, black, white, threshold);
      }
      case "multiply": {
        hex = getColor(addonId, obj.source);
        return textColorLib.multiply(hex, obj);
      }
      case "brighten": {
        hex = getColor(addonId, obj.source);
        return textColorLib.brighten(hex, obj);
      }
      case "alphaBlend": {
        let opaqueHex = getColor(addonId, obj.opaqueSource);
        let transparentHex = getColor(addonId, obj.transparentSource);
        return textColorLib.alphaBlend(opaqueHex, transparentHex);
      }
      case "makeHsv": {
        let hSource = getColor(addonId, obj.h);
        let sSource = getColor(addonId, obj.s);
        let vSource = getColor(addonId, obj.v);
        return textColorLib.makeHsv(hSource, sSource, vSource);
      }
      case "recolorFilter": {
        hex = getColor(addonId, obj.source);
        return textColorLib.recolorFilter(hex);
      }
    }
  };

  for (const addon of addonsWithUserstyles) {
    const addonId = addon.addonId;
    for (const customVar of addon.cssVariables) {
      const varName = customVar.name;
      const varValue = getColor(addonId, customVar.value);
      if (varValue === null && customVar.dropNull) {
        removeVar(addonId, varName);
      } else {
        setVar(addonId, varName, varValue);
      }
    }
  }
}

function waitForDocumentHead() {
  if (document.head) return Promise.resolve();
  else {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.head) {
          resolve();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true });
    });
  }
}

function getL10NURLs() {
  const langCode = /scratchlanguage=([\w-]+)/.exec(document.cookie)?.[1] || "en";
  const urls = [chrome.runtime.getURL(`addons-l10n/${langCode}`)];
  if (langCode === "pt") {
    urls.push(chrome.runtime.getURL(`addons-l10n/pt-br`));
  }
  if (langCode.includes("-")) {
    urls.push(chrome.runtime.getURL(`addons-l10n/${langCode.split("-")[0]}`));
  }
  const enJSON = chrome.runtime.getURL("addons-l10n/en");
  if (!urls.includes(enJSON)) urls.push(enJSON);
  return urls;
}

async function onInfoAvailable({ globalState: globalStateMsg, addonsWithUserscripts, addonsWithUserstyles }) {
  // In order for the "everLoadedAddons" not to change when "addonsWithUserscripts" changes, we stringify and parse
  const everLoadedAddons = JSON.parse(JSON.stringify(addonsWithUserscripts));
  const disabledDynamicAddons = [];
  globalState = globalStateMsg;
  setCssVariables(globalState.addonSettings, addonsWithUserstyles);
  // Just in case, make sure the <head> loaded before injecting styles
  waitForDocumentHead().then(() => injectUserstyles(addonsWithUserstyles));
  if (!_page_) {
    await new Promise((resolve) => {
      // We're registering this load event after the load event that
      // sets _page_, so we can guarantee _page_ exists now
      moduleScript.addEventListener("load", resolve);
    });
  }

  _page_.globalState = globalState;
  _page_.l10njson = getL10NURLs();
  _page_.addonsWithUserscripts = addonsWithUserscripts;
  _page_.dataReady = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.newGlobalState) {
      _page_.globalState = request.newGlobalState;
      globalState = request.newGlobalState;
      setCssVariables(request.newGlobalState.addonSettings, addonsWithUserstyles);
    } else if (request.fireEvent) {
      _page_.fireEvent(request.fireEvent);
    } else if (request.dynamicAddonEnabled) {
      const { scripts, userstyles, cssVariables, addonId, injectAsStyleElt, index, dynamicEnable, dynamicDisable } =
        request.dynamicAddonEnabled;
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
      if (everLoadedAddons.find((addon) => addon.addonId === addonId)) {
        if (!dynamicDisable) return;
        // Addon was reenabled
        _page_.fireEvent({ name: "reenabled", addonId, target: "self" });
      } else {
        if (!dynamicEnable) return;
        // Addon was not injected in page yet
        _page_.runAddonUserscripts({ addonId, scripts, enabledLate: true });
      }

      addonsWithUserscripts.push({ addonId, scripts });
      addonsWithUserstyles.push({ styles: userstyles, cssVariables, addonId, injectAsStyleElt, index });
      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
      everLoadedAddons.push({ addonId, scripts });
    } else if (request.dynamicAddonDisable) {
      const { addonId } = request.dynamicAddonDisable;
      disabledDynamicAddons.push(addonId);

      let addonIndex = addonsWithUserscripts.findIndex((a) => a.addonId === addonId);
      if (addonIndex !== -1) addonsWithUserscripts.splice(addonIndex, 1);
      addonIndex = addonsWithUserstyles.findIndex((a) => a.addonId === addonId);
      if (addonIndex !== -1) addonsWithUserstyles.splice(addonIndex, 1);

      removeAddonStyles(addonId);
      _page_.fireEvent({ name: "disabled", addonId, target: "self" });
      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
    } else if (request.updateUserstylesSettingsChange) {
      const { userstyles, addonId, injectAsStyleElt, index } = request.updateUserstylesSettingsChange;
      // Removing the addon styles and readding them works since the background
      // will send a different array for the new valid userstyles.
      // Try looking for the "userscriptMatches" function.
      removeAddonStyles(addonId);
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
    } else if (request === "getRunningAddons") {
      const userscripts = addonsWithUserscripts.map((obj) => obj.addonId);
      const userstyles = addonsWithUserstyles.map((obj) => obj.addonId);
      sendResponse({ userscripts, userstyles, disabledDynamicAddons });
    } else if (request === "refetchSession") {
      _page_.refetchSession();
    }
  });
}

if (location.pathname.startsWith("/discuss/")) {
  // We do this first as sb2 runs fast.
  const preserveBlocks = () => {
    document.querySelectorAll("pre.blocks").forEach((el) => {
      el.setAttribute("data-original", el.innerText);
    });
  };
  if (document.readyState !== "loading") {
    setTimeout(preserveBlocks, 0);
  } else {
    window.addEventListener("DOMContentLoaded", preserveBlocks, { once: true });
  }
}
