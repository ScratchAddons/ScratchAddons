try {
  // Property window.top.location.origin matches the origin that corresponds to
  // the URL displayed on the address bar, for this tab.
  // Meanwhile, window.location.origin can only correspond to one of the content
  // script matches which are declared in the manifest.json file. In normal use,
  // it will always equal `https://scratch.mit.edu`.
  if (window.top.location.origin !== window.location.origin) throw "";
} catch {
  throw "Scratch Addons: cross-origin iframe ignored";
}
if (window.frameElement && window.frameElement.getAttribute("src") === null)
  throw "Scratch Addons: iframe without src attribute ignored";
if (document.documentElement instanceof SVGElement) throw "Scratch Addons: SVG document ignored";

const MAX_USERSTYLES_PER_ADDON = 100;

const _realConsole = window.console;
const consoleOutput = (logAuthor = "[cs]") => {
  const style = {
    // Remember to change these as well on module.js
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};
const console = {
  ..._realConsole,
  log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
  warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
  error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
};

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

const DOLLARS = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"];

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

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
comlinkIframesDiv.appendChild(comlinkIframe1);
comlinkIframesDiv.appendChild(comlinkIframe2);
comlinkIframesDiv.appendChild(comlinkIframe3);
comlinkIframesDiv.appendChild(comlinkIframe4);
document.documentElement.appendChild(comlinkIframesDiv);

const csUrlObserver = new EventTarget();
const cs = {
  _url: location.href, // Updated by module.js on calls to history.replaceState/pushState
  get url() {
    return this._url;
  },
  set url(newUrl) {
    this._url = newUrl;
    csUrlObserver.dispatchEvent(new CustomEvent("change", { detail: { newUrl } }));
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
if (path === "discuss/3/topic/add/") {
  window.addEventListener("load", () => forumWarning("forumWarning"));
} else if (path.startsWith("discuss/topic/")) {
  window.addEventListener("load", () => {
    if (document.querySelector('div.linkst > ul > li > a[href="/discuss/18/"]')) {
      forumWarning("forumWarningGeneral");
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message from background]", request);
  if (request === "getInitialUrl") {
    sendResponse(pseudoUrl || initialUrl);
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
        return getColor(addonId, obj.options[getColor(addonId, obj.source)] ?? obj.default);
      case "textColor": {
        hex = getColor(addonId, obj.source);
        let black = getColor(addonId, obj.black);
        let white = getColor(addonId, obj.white);
        let threshold = getColor(addonId, obj.threshold);
        return textColorLib.textColor(hex, black, white, threshold);
      }
      case "alphaThreshold": {
        hex = getColor(addonId, obj.source);
        let { a } = textColorLib.parseHex(hex);
        let threshold = getColor(addonId, obj.threshold) || 0.5;
        if (a >= threshold) return getColor(addonId, obj.opaque);
        else return getColor(addonId, obj.transparent);
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
  const langCode = /scratchlanguage=([\w-]+)/.exec(document.cookie)?.[1] || navigator.language;
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
  const everLoadedUserscriptAddons = new Set(addonsWithUserscripts.map((entry) => entry.addonId));
  const disabledDynamicAddons = new Set();
  globalState = globalStateMsg;
  setCssVariables(globalState.addonSettings, addonsWithUserstyles);
  // Just in case, make sure the <head> loaded before injecting styles
  waitForDocumentHead().then(() => injectUserstyles(addonsWithUserstyles));

  chrome.runtime.onMessage.addListener((request) => {
    if (request.dynamicAddonEnabled) {
      const {
        scripts,
        userstyles,
        cssVariables,
        addonId,
        injectAsStyleElt,
        index,
        dynamicEnable,
        dynamicDisable,
        partial,
      } = request.dynamicAddonEnabled;
      disabledDynamicAddons.delete(addonId);
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
      if (partial) {
        // Partial: part of userstyle was (re-)enabled.
        // No need to deal with userscripts here.
        const addonsWithUserstylesEntry = addonsWithUserstyles.find((entry) => entry.addonId === addonId);
        if (addonsWithUserstylesEntry) {
          addonsWithUserstylesEntry.styles = userstyles;
        } else {
          addonsWithUserstyles.push({ styles: userstyles, cssVariables, addonId, injectAsStyleElt, index });
        }
      } else {
        // Non-partial: the whole addon was (re-)enabled.
        if (everLoadedUserscriptAddons.has(addonId)) {
          if (!dynamicDisable) return;
          // Addon was reenabled
          _page_.fireEvent({ name: "reenabled", addonId, target: "self" });
        } else {
          if (!dynamicEnable) return;
          // Addon was not injected in page yet

          // If the the module wasn't loaded yet, don't run these scripts as they will run later anyway.
          if (_page_) {
            _page_.runAddonUserscripts({ addonId, scripts, enabledLate: true });
            everLoadedUserscriptAddons.add(addonId);
          }
        }

        addonsWithUserscripts.push({ addonId, scripts });
        addonsWithUserstyles.push({ styles: userstyles, cssVariables, addonId, injectAsStyleElt, index });
      }
      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
    } else if (request.dynamicAddonDisable) {
      // Note: partialDynamicDisabledStyles includes ones that are disabled currently, too!
      const { addonId, partialDynamicDisabledStyles } = request.dynamicAddonDisable;
      // This may run twice if the style-only addon was first "partially"
      // (but in fact entirely) disabled, and it was then toggled off.
      // Early return in this situation.
      if (disabledDynamicAddons.has(addonId)) return;
      const scriptIndex = addonsWithUserscripts.findIndex((a) => a.addonId === addonId);
      const styleIndex = addonsWithUserstyles.findIndex((a) => a.addonId === addonId);
      if (_page_) {
        if (partialDynamicDisabledStyles) {
          // Userstyles are partially disabled.
          // This should not result in other parts being disabled,
          // unless that means no scripts/styles are running on this page.
          removeAddonStylesPartial(addonId, partialDynamicDisabledStyles);
          if (styleIndex > -1) {
            // This should exist... right? Safeguarding anyway
            const userstylesEntry = addonsWithUserstyles[styleIndex];
            userstylesEntry.styles = userstylesEntry.styles.filter(
              (style) => !partialDynamicDisabledStyles.includes(style.href)
            );
            if (userstylesEntry.styles.length || scriptIndex > -1) {
              // The addon was not completely disabled, so early return.
              // Note: we do not need to recalculate cssVariables here
              return;
            }
          }
        } else {
          removeAddonStyles(addonId);
        }
        disabledDynamicAddons.add(addonId);
        _page_.fireEvent({ name: "disabled", addonId, target: "self" });
      } else {
        everLoadedUserscriptAddons.delete(addonId);
      }
      if (scriptIndex !== -1) addonsWithUserscripts.splice(scriptIndex, 1);
      if (styleIndex !== -1) addonsWithUserstyles.splice(styleIndex, 1);

      setCssVariables(globalState.addonSettings, addonsWithUserstyles);
    } else if (request.updateUserstylesSettingsChange) {
      const {
        userstyles,
        addonId,
        injectAsStyleElt,
        index,
        dynamicEnable,
        dynamicDisable,
        addonSettings,
        cssVariables,
      } = request.updateUserstylesSettingsChange;
      const addonIndex = addonsWithUserstyles.findIndex((addon) => addon.addonId === addonId);
      removeAddonStyles(addonId);
      if (addonIndex > -1 && userstyles.length === 0 && dynamicDisable) {
        // This is actually dynamicDisable condition, but since this does not involve
        // toggling addon state, this is not considered one by the code.
        addonsWithUserstyles.splice(addonIndex, 1);
        // This might race with newGlobalState, so we merge explicitly here
        setCssVariables({ ...globalState.addonSettings, [addonId]: addonSettings }, addonsWithUserstyles);
        console.log(`Dynamically disabling all userstyles of ${addonId} due to settings change`);
        // Early return because we know addStyle will be no-op
        return;
        // Wait, but what about userscripts? Great question. No, we do not need to fire events
        // or handle userscripts at all. This is because settings change does not cause
        // userscripts to be enabled or disabled (only userstyles). Instead userscripts
        // should always be executed but listen to settings change event. Thus this
        // "dynamic disable" does not fire disable event, because userscripts aren't disabled.
      }
      if (addonIndex > -1 && (dynamicDisable || dynamicEnable)) {
        // Userstyles enabled when there are already enabled ones, or
        // userstyles partially disabled. do not call
        // removeAddonStylesPartial as we remove and re-add instead.
        const userstylesEntry = addonsWithUserstyles[addonIndex];
        userstylesEntry.styles = userstyles;
      }
      if (addonIndex === -1 && userstyles.length > 0 && dynamicEnable) {
        // This is actually dynamicEnable condition, but since this does not involve
        // toggling addon state, this is not considered one by the code.
        console.log(`Dynamically enabling userstyle addon ${addonId} due to settings change`);
        addonsWithUserstyles.push({ styles: userstyles, cssVariables, addonId, injectAsStyleElt, index });
        disabledDynamicAddons.delete(addonId);
        setCssVariables({ ...globalState.addonSettings, [addonId]: addonSettings }, addonsWithUserstyles);
        // Same goes here; enabling a setting does not run or re-enable an userscript by design.
      }
      // Removing the addon styles and readding them works since the background
      // will send a different array for the new valid userstyles.
      // Try looking for the "userscriptMatches" function.
      addStyle({ styles: userstyles, addonId, injectAsStyleElt, index });
    }
  });
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
    } else if (request === "getRunningAddons") {
      const userscripts = addonsWithUserscripts.map((obj) => obj.addonId);
      const userstyles = addonsWithUserstyles.map((obj) => obj.addonId);
      sendResponse({
        userscripts,
        userstyles,
        disabledDynamicAddons: Array.from(disabledDynamicAddons),
      });
    } else if (request === "refetchSession") {
      _page_.refetchSession();
    }
  });
}

const escapeHTML = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);

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

function forumWarning(key) {
  let postArea = document.querySelector("form#post > label");
  if (postArea) {
    var errorList = document.querySelector("form#post > label > ul");
    if (!errorList) {
      let typeArea = postArea.querySelector("strong");
      errorList = document.createElement("ul");
      errorList.classList.add("errorlist");
      postArea.insertBefore(errorList, typeArea);
    }
    let addonError = document.createElement("li");
    let reportLink = document.createElement("a");
    const uiLanguage = chrome.i18n.getUILanguage();
    const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
    const utm = `utm_source=extension&utm_medium=forumwarning&utm_campaign=v${chrome.runtime.getManifest().version}`;
    reportLink.href = `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${
      chrome.runtime.getManifest().version
    }&${utm}`;
    reportLink.target = "_blank";
    reportLink.innerText = chrome.i18n.getMessage("reportItHere");
    let text1 = document.createElement("span");
    text1.innerHTML = escapeHTML(chrome.i18n.getMessage(key, DOLLARS)).replace("$1", reportLink.outerHTML);
    addonError.appendChild(text1);
    errorList.appendChild(addonError);
  }
}

const showBanner = () => {
  const makeBr = () => document.createElement("br");

  const notifOuterBody = document.createElement("div");
  const notifInnerBody = Object.assign(document.createElement("div"), {
    id: "sa-notification",
    style: `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 700px;
    max-height: 270px;
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 10px;
    background-color: #222;
    color: white;
    z-index: 99999;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    text-shadow: none;
    box-shadow: 0 0 20px 0px #0000009e;
    font-size: 14px;
    line-height: normal;`,
  });
  /*
  const notifImageLink = Object.assign(document.createElement("a"), {
    href: "https://www.youtube.com/watch?v=oRo0tMWEpiA",
    target: "_blank",
    rel: "noopener",
    referrerPolicy: "strict-origin-when-cross-origin",
  });
  // Thumbnails were 100px height
  */
  const notifImage = Object.assign(document.createElement("img"), {
    // alt: chrome.i18n.getMessage("hexColorPickerAlt"),
    src: chrome.runtime.getURL("/images/cs/icon.png"),
    style: "height: 150px; border-radius: 5px; padding: 20px",
  });
  const notifText = Object.assign(document.createElement("div"), {
    id: "sa-notification-text",
    style: "margin: 12px;",
  });
  const notifTitle = Object.assign(document.createElement("span"), {
    style: "font-size: 18px; line-height: normal; display: inline-block; margin-bottom: 12px;",
    textContent: chrome.i18n.getMessage("extensionUpdate"),
  });
  const notifClose = Object.assign(document.createElement("img"), {
    style: `
    float: right;
    cursor: pointer;
    width: 24px;`,
    title: chrome.i18n.getMessage("close"),
    src: chrome.runtime.getURL("../images/cs/close.svg"),
  });
  notifClose.addEventListener("click", () => notifInnerBody.remove(), { once: true });

  const NOTIF_TEXT_STYLE = "display: block; color: white !important;";
  const NOTIF_LINK_STYLE = "color: #1aa0d8; font-weight: normal; text-decoration: underline;";

  const notifInnerText0 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE + "font-weight: bold;",
    textContent: chrome.i18n
      .getMessage("extensionHasUpdated", DOLLARS)
      .replace(/\$(\d+)/g, (_, i) => [chrome.runtime.getManifest().version][Number(i) - 1]),
  });
  const notifInnerText1 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    innerHTML: escapeHTML(chrome.i18n.getMessage("extensionUpdateInfo1_v1_36", DOLLARS)).replace(
      /\$(\d+)/g,
      (_, i) =>
        [
          /*
          Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("newFeature") }).outerHTML,
          Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("newFeatureName") })
            .outerHTML,
          */
          Object.assign(document.createElement("a"), {
            href: "https://scratch.mit.edu/scratch-addons-extension/settings?source=updatenotif",
            target: "_blank",
            style: NOTIF_LINK_STYLE,
            textContent: chrome.i18n.getMessage("scratchAddonsSettings"),
          }).outerHTML,
        ][Number(i) - 1]
    ),
  });
  const notifInnerText2 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    textContent: chrome.i18n.getMessage("extensionUpdateInfo2_v1_36"),
  });
  const notifFooter = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
  });
  const uiLanguage = chrome.i18n.getUILanguage();
  const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
  const utm = `utm_source=extension&utm_medium=updatenotification&utm_campaign=v${
    chrome.runtime.getManifest().version
  }`;
  const notifFooterChangelog = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/${localeSlash}changelog?${utm}`,
    target: "_blank",
    style: NOTIF_LINK_STYLE,
    textContent: chrome.i18n.getMessage("notifChangelog"),
  });
  const notifFooterFeedback = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/${localeSlash}feedback/?ext_version=${
      chrome.runtime.getManifest().version
    }&${utm}`,
    target: "_blank",
    style: NOTIF_LINK_STYLE,
    textContent: chrome.i18n.getMessage("feedback"),
  });
  const notifFooterTranslate = Object.assign(document.createElement("a"), {
    href: "https://scratchaddons.com/translate",
    target: "_blank",
    style: NOTIF_LINK_STYLE,
    textContent: chrome.i18n.getMessage("translate"),
  });
  const notifFooterLegal = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE + "font-size: 12px;",
    textContent: chrome.i18n.getMessage("notAffiliated"),
  });
  notifFooter.appendChild(notifFooterChangelog);
  notifFooter.appendChild(document.createTextNode(" | "));
  notifFooter.appendChild(notifFooterFeedback);
  notifFooter.appendChild(document.createTextNode(" | "));
  notifFooter.appendChild(notifFooterTranslate);
  notifFooter.appendChild(makeBr());
  notifFooter.appendChild(notifFooterLegal);

  notifText.appendChild(notifTitle);
  notifText.appendChild(notifClose);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText0);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText1);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifInnerText2);
  notifText.appendChild(makeBr());
  notifText.appendChild(notifFooter);

  // notifImageLink.appendChild(notifImage);

  notifInnerBody.appendChild(notifImage);
  notifInnerBody.appendChild(notifText);

  notifOuterBody.appendChild(notifInnerBody);

  document.body.appendChild(notifOuterBody);
};

const handleBanner = async () => {
  if (window.frameElement) return;
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, _] = currentVersion.split(".");
  const currentVersionMajorMinor = `${major}.${minor}`;
  // Making this configurable in the future?
  // Using local because browser extensions may not be updated at the same time across browsers
  const settings = await promisify(chrome.storage.local.get.bind(chrome.storage.local))(["bannerSettings"]);
  const force = !settings || !settings.bannerSettings;

  if (force || settings.bannerSettings.lastShown !== currentVersionMajorMinor || location.hash === "#sa-update-notif") {
    console.log("Banner shown.");
    await promisify(chrome.storage.local.set.bind(chrome.storage.local))({
      bannerSettings: Object.assign({}, settings.bannerSettings, { lastShown: currentVersionMajorMinor }),
    });
    showBanner();
  }
};

if (document.readyState !== "loading") {
  handleBanner();
} else {
  window.addEventListener("DOMContentLoaded", handleBanner, { once: true });
}

const isProfile = pathArr[0] === "users" && pathArr[2] === "";
const isStudio = pathArr[0] === "studios";
const isProject = pathArr[0] === "projects";
const isForums = pathArr[0] === "discuss";

if (isProfile || isStudio || isProject || isForums) {
  const removeReiteratedChars = (string) =>
    string
      .split("")
      .filter((char, i, charArr) => (i === 0 ? true : charArr[i - 1] !== char))
      .join("");

  const shouldCaptureComment = (value) => {
    const trimmedValue = value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trim like scratchr2
    const limitedValue = removeReiteratedChars(trimmedValue.toLowerCase().replace(/[^a-z]+/g, ""));
    const regex = /scratchadons/;
    return regex.test(limitedValue);
  };
  const extensionPolicyLink = document.createElement("a");
  extensionPolicyLink.href = "https://scratch.mit.edu/discuss/topic/284272/";
  extensionPolicyLink.target = "_blank";
  extensionPolicyLink.innerText = chrome.i18n.getMessage("captureCommentPolicy");
  Object.assign(extensionPolicyLink.style, {
    textDecoration: "underline",
    color: isForums ? "" : "white",
  });
  const errorMsgHtml = escapeHTML(chrome.i18n.getMessage("captureCommentError", DOLLARS)).replace(
    "$1",
    extensionPolicyLink.outerHTML
  );
  const sendAnywayMsg = chrome.i18n.getMessage("captureCommentPostAnyway");
  const confirmMsg = chrome.i18n.getMessage("captureCommentConfirm");

  if (isProfile) {
    window.addEventListener(
      "click",
      (e) => {
        if (e.target.tagName !== "A" || !e.target.parentElement.matches("div.button[data-commentee-id]")) return;
        const form = e.target.closest("form");
        if (!form) return;
        if (form.hasAttribute("data-sa-send-anyway")) {
          form.removeAttribute("data-sa-send-anyway");
          return;
        }
        const textarea = form.querySelector("textarea[name=content]");
        if (!textarea) return;
        if (shouldCaptureComment(textarea.value)) {
          e.stopPropagation();
          e.preventDefault(); // Avoid location.hash being set to null

          form.querySelector("[data-control=error] .text").innerHTML = errorMsgHtml + " ";
          const sendAnyway = document.createElement("a");
          sendAnyway.onclick = () => {
            const res = confirm(confirmMsg);
            if (res) {
              form.setAttribute("data-sa-send-anyway", "");
              form.querySelector("[data-control=post]").click();
            }
          };
          sendAnyway.textContent = sendAnywayMsg;
          Object.assign(sendAnyway.style, {
            textDecoration: "underline",
            color: "white",
          });
          form.querySelector("[data-control=error] .text").appendChild(sendAnyway);
          form.querySelector(".control-group").classList.add("error");
        }
      },
      { capture: true }
    );
  } else if (isProject || isStudio) {
    window.addEventListener(
      "click",
      (e) => {
        if (!(e.target.tagName === "SPAN" || e.target.tagName === "BUTTON")) return;
        if (!e.target.closest("button.compose-post")) return;
        const form = e.target.closest("form.full-width-form");
        if (!form) return;
        // Remove error when about to send comment anyway, if it exists
        form.parentNode.querySelector(".sa-compose-error-row")?.remove();
        if (form.hasAttribute("data-sa-send-anyway")) {
          form.removeAttribute("data-sa-send-anyway");
          return;
        }
        const textarea = form.querySelector("textarea[name=compose-comment]");
        if (!textarea) return;
        if (shouldCaptureComment(textarea.value)) {
          e.stopPropagation();
          const errorRow = document.createElement("div");
          errorRow.className = "flex-row compose-error-row sa-compose-error-row";
          const errorTip = document.createElement("div");
          errorTip.className = "compose-error-tip";
          const span = document.createElement("span");
          span.innerHTML = errorMsgHtml + " ";
          const sendAnyway = document.createElement("a");
          sendAnyway.onclick = () => {
            const res = confirm(confirmMsg);
            if (res) {
              form.setAttribute("data-sa-send-anyway", "");
              form.querySelector(".compose-post")?.click();
            }
          };
          sendAnyway.textContent = sendAnywayMsg;
          errorTip.appendChild(span);
          errorTip.appendChild(sendAnyway);
          errorRow.appendChild(errorTip);
          form.parentNode.prepend(errorRow);

          // Hide error after typing like scratch-www does
          textarea.addEventListener(
            "input",
            () => {
              errorRow.remove();
            },
            { once: true }
          );
          // Hide error after clicking cancel like scratch-www does
          form.querySelector(".compose-cancel").addEventListener(
            "click",
            () => {
              errorRow.remove();
            },
            { once: true }
          );
        }
      },
      { capture: true }
    );
  } else if (isForums) {
    window.addEventListener("click", (e) => {
      const potentialPostButton = e.target.closest("button[type=submit]");
      if (!potentialPostButton) return;
      const form = e.target.closest("form");
      if (!form) return;
      if (form.hasAttribute("data-sa-send-anyway")) {
        form.removeAttribute("data-sa-send-anyway");
        return;
      }
      const existingWarning = form.parentElement.querySelector(".sa-extension-policy-warning");
      if (existingWarning) {
        // Do nothing. The warning automatically disappears after typing into the form.
        e.preventDefault();
        existingWarning.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const textarea = form.querySelector("textarea.markItUpEditor");
      if (!textarea) return;
      if (shouldCaptureComment(textarea.value)) {
        const errorTip = document.createElement("li");
        errorTip.classList.add("errorlist", "sa-extension-policy-warning");
        errorTip.style.scrollMarginTop = "50px";
        errorTip.style.fontWeight = "bold";
        errorTip.innerHTML = errorMsgHtml + " ";
        const sendAnyway = document.createElement("a");
        sendAnyway.onclick = () => {
          const res = confirm(confirmMsg);
          if (res) {
            form.setAttribute("data-sa-send-anyway", "");
            form.querySelector("button[type=submit]")?.click();
          }
        };
        sendAnyway.textContent = sendAnywayMsg;
        errorTip.appendChild(sendAnyway);

        const postArea = form.querySelector("label");
        if (!postArea) return;
        let errorList = form.querySelector("label > ul");
        if (!errorList) {
          const typeArea = postArea.querySelector("strong");
          errorList = document.createElement("ul");
          errorList.classList.add("errorlist");
          postArea.insertBefore(errorList, typeArea);
        }

        errorList.appendChild(errorTip);
        errorTip.scrollIntoView({ behavior: "smooth" });
        e.preventDefault();

        // Hide error after typing
        textarea.addEventListener(
          "input",
          () => {
            errorTip.remove();
            if (errorList.querySelector("li") === null) {
              errorList.remove();
            }
          },
          { once: true }
        );
      }
    });
  }
}
