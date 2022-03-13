function getGlobalState() {
  return {
    auth: {
      isLoggedIn: false,
      username: null,
      userId: null,
      xToken: null,
      csrfToken: null,
      scratchLang: "en",
    },
  };
}
const MAX_USERSTYLES_PER_ADDON = 100;

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
comlinkIframesDiv.appendChild(comlinkIframe1);
comlinkIframesDiv.appendChild(comlinkIframe2);
comlinkIframesDiv.appendChild(comlinkIframe3);
comlinkIframesDiv.appendChild(comlinkIframe4);
document.documentElement.appendChild(comlinkIframesDiv);

function loadScript(src, isModule) {
  const elem = document.createElement("script");
  elem.src = src;
  if (isModule) elem.type = "module";
  return new Promise((resolve) => {
    elem.onload = resolve;
    (document.head || document.documentElement).appendChild(elem);
  });
}

loadScript(chrome.runtime.getURL("/libraries/thirdparty/cs/comlink.js"));

const cs = {
  _url: location.href, // Updated by module.js on calls to history.replaceState/pushState
  get url() {
    return this._url;
  },
  set url(newUrl) {
    this._url = newUrl;
  },
};
let _page_;

Comlink.expose(cs, Comlink.windowEndpoint(comlinkIframe1.contentWindow, comlinkIframe2.contentWindow));

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

  if (addon.styles.length > MAX_USERSTYLES_PER_ADDON) {
    console.warn(
      "Please increase MAX_USERSTYLES_PER_ADDON in content-scripts/cs.js, otherwise style priority is not guaranteed! Has",
      addon.styles.length,
      "styles, current max is",
      MAX_USERSTYLES_PER_ADDON
    );
  }
  for (let i = 0; i < addon.styles.length; i++) {
    const userstyle = addon.styles[i];
    const styleIndex = addon.index * MAX_USERSTYLES_PER_ADDON + userstyle.index;
    if (addon.injectAsStyleElt) {
      // If an existing style is already appended, just enable it instead
      const existingEl = addonStyles.find((style) => style.dataset.styleHref === userstyle.href);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const style = document.createElement("style");
      style.classList.add("scratch-addons-style");
      style.setAttribute("data-addon-id", addon.addonId);
      style.setAttribute("data-addon-index", styleIndex);
      style.setAttribute("data-style-href", userstyle.href);
      style.textContent = userstyle.text;
      appendByIndex(style, styleIndex);
    } else {
      const existingEl = addonStyles.find((style) => style.href === userstyle.href);
      if (existingEl) {
        existingEl.disabled = false;
        continue;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-addon-id", addon.addonId);
      link.setAttribute("data-addon-index", styleIndex);
      link.classList.add("scratch-addons-style");
      link.href = userstyle.href;
      appendByIndex(link, styleIndex);
    }
  }
}
function removeAddonStyles(addonId) {
  // Instead of actually removing the style/link element, we just disable it.
  // That way, if the addon needs to be reenabled, it can just enable that style/link element instead of readding it.
  // This helps with load times for link elements.
  document.querySelectorAll(`[data-addon-id='${addonId}']`).forEach((style) => (style.disabled = true));
}
function removeAddonStylesPartial(addonId, stylesToRemove) {
  document.querySelectorAll(`[data-addon-id='${addonId}']`).forEach((style) => {
    if (stylesToRemove.includes(style.href || style.dataset.styleHref)) style.disabled = true;
  });
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
    if (typeof obj !== "object" || obj === null) return obj;
    let hex;
    switch (obj.type) {
      case "settingValue":
        return addonSettings[addonId][obj.settingId];
      case "ternary":
        // this is not even a color lol
        return getColor(addonId, obj.source) ? getColor(addonId, obj.true) : getColor(addonId, obj.false);
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

Promise.all([
  loadScript(chrome.runtime.getURL("/content-scripts/inject/module.js"), true),
  new Promise((resolve) => {
    chrome.runtime.sendMessage("getEditorInfo", resolve);
  }),
]).then(([_, info]) => {
  _page_ = Comlink.wrap(Comlink.windowEndpoint(comlinkIframe3.contentWindow, comlinkIframe4.contentWindow));
  setCssVariables(info.globalState.addonSettings, info.addonsWithUserstyles);
  // Just in case, make sure the <head> loaded before injecting styles
  waitForDocumentHead().then(() => injectUserstyles(info.addonsWithUserstyles));

  _page_.globalState = Object.assign({}, info.globalState, getGlobalState());
  _page_.l10njson = [chrome.runtime.getURL("addons-l10n/en")];
  _page_.addonsWithUserscripts = info.addonsWithUserscripts;
  _page_.dataReady = true;
});
