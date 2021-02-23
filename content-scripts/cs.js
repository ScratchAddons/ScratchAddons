try {
  if (window.parent.location.origin !== "https://scratch.mit.edu") throw "Scratch Addons: not first party iframe";
} catch {
  throw "Scratch Addons: not first party iframe";
}

const DOLLARS = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"];

const promisify = (callbackFn) => (...args) => new Promise((resolve) => callbackFn(...args, resolve));

let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] !== "/") path += "/";
const pathArr = path.split("/");
if (pathArr[0] === "scratch-addons-extension") {
  if (pathArr[1] === "settings") chrome.runtime.sendMessage("openSettingsOnThisTab");
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

let receivedContentScriptInfo = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message from background]", request);
  if (request.contentScriptInfo) {
    // The request wasn't for this exact URL, might happen sometimes
    if (request.contentScriptInfo.url !== initialUrl) return;
    // Only run once - updates go through themesUpdated
    if (receivedContentScriptInfo) return;
    receivedContentScriptInfo = true;
    sendResponse("OK");

    if (document.head) onHeadAvailable(request.contentScriptInfo);
    else {
      const observer = new MutationObserver(() => {
        if (document.head) {
          onHeadAvailable(request.contentScriptInfo);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true });
    }
  } else if (request === "getInitialUrl") {
    sendResponse(initialUrl);
  } else if (request.themesUpdated) {
    injectUserstylesAndThemes({ themes: request.themesUpdated, isUpdate: true });
  } else if (request.newAddonState) {
    let addonId = request.newAddonState.addonId;
    if (request.newAddonState.newState) {
      postMessage({ saAddonEnabled: addonId }, "*");
    } else {
      postMessage({ saAddonDisabled: addonId }, "*");
    }

  }
});
chrome.runtime.sendMessage("ready");
window.addEventListener("load", () => {
  if (!receivedContentScriptInfo) {
    // This might happen sometimes, the background page might not
    // have seen this tab loading, for example, at startup.
    chrome.runtime.sendMessage("sendContentScriptInfo");
  }
});

function injectUserstylesAndThemes({ userstyleUrls, themes, isUpdate }) {
  document.querySelectorAll(".scratch-addons-theme").forEach((style) => {
    if (!style.textContent.startsWith("/* sa-autoupdate-theme-ignore */")) style.remove();
  });
  for (const userstyleUrl of userstyleUrls || []) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = userstyleUrl;
    if (document.body) document.documentElement.insertBefore(link, document.body);
    else document.documentElement.appendChild(link);
  }
  for (const theme of themes) {
    for (const styleUrl of theme.styleUrls) {
      let css = theme.styles[styleUrl];
      // Replace %addon-self-dir% for relative URLs
      css = css.replace(/\%addon-self-dir\%/g, chrome.runtime.getURL(`addons/${theme.addonId}`));
      if (
        isUpdate &&
        (css.startsWith("/* sa-autoupdate-theme-ignore */") || css.startsWith("/* sa-theme-enable-ignore */"))
      )
        continue;
      css += `\n/*# sourceURL=${styleUrl} */`;
      const style = document.createElement("style");
      style.classList.add("scratch-addons-theme");
      style.setAttribute("data-addon-id", theme.addonId);
      style.textContent = css;
      if (document.body) document.documentElement.insertBefore(style, document.body);
      else document.documentElement.appendChild(style);
    }
  }
}

function setCssVariables(addonSettings) {
  for (const addonId of Object.keys(addonSettings)) {
    for (const settingName of Object.keys(addonSettings[addonId])) {
      const value = addonSettings[addonId][settingName];
      if (typeof value === "string" || typeof value === "number")
        document.documentElement.style.setProperty(
          `--${addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-${settingName.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          )}`,
          addonSettings[addonId][settingName]
        );
    }
  }
}

function onHeadAvailable({ globalState, l10njson, allAddons, addonsWithUserscripts, userstyleUrls, themes }) {
  setCssVariables(globalState.addonSettings);
  injectUserstylesAndThemes({ userstyleUrls, themes, isUpdate: false });

  const template = document.createElement("template");
  template.id = "scratch-addons";
  template.setAttribute("data-path", chrome.runtime.getURL(""));
  template.setAttribute("data-alladdons", JSON.stringify(allAddons));
  template.setAttribute("data-userscripts", JSON.stringify(addonsWithUserscripts));
  template.setAttribute("data-global-state", JSON.stringify(globalState));
  template.setAttribute("data-l10njson", JSON.stringify(l10njson));
  document.head.appendChild(template);

  const script = document.createElement("script");
  script.type = "module";
  script.src = chrome.runtime.getURL("content-scripts/inject/module.js");
  document.head.appendChild(script);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.newGlobalState) {
      template.setAttribute("data-global-state", JSON.stringify(request.newGlobalState));
      setCssVariables(request.newGlobalState.addonSettings);
    } else if (request.fireEvent) {
      const eventDetails = JSON.stringify(request.fireEvent);
      template.setAttribute(`data-fire-event__${Date.now()}`, eventDetails);
    } else if (typeof request.setMsgCount !== "undefined") {
      template.setAttribute("data-msgcount", request.setMsgCount);
    } else if (request === "getRunningAddons") {
      // We need to send themes that might have been injected dynamically
      sendResponse([
        ...new Set([
          ...JSON.parse(template.getAttribute("data-userscripts")).map((obj) => obj.addonId),
          ...Array.from(document.querySelectorAll(".scratch-addons-theme")).map((style) =>
            style.getAttribute("data-addon-id")
          ),
        ]),
      ]);
    }
  });

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
      console.log("[Attribute update]", attr + ":", attrVal);
      const removeAttr = () => template.removeAttribute(attr);
      if (attrType === "data-request-msgcount") {
        chrome.runtime.sendMessage("getMsgCount");
        removeAttr();
      }
      if (attr === "data-clipboard-image" && typeof browser !== "undefined") {
        const dataURL = attrVal;
        removeAttr();
        browser.runtime.sendMessage({ clipboardDataURL: dataURL }).then(
          (res) => {
            template.setAttribute("data-clipboard", "success");
          },
          (res) => {
            console.error("Error inside clipboard: ", res);
            template.setAttribute("data-clipboard", res.toString());
          }
        );
      }
    }
  });
  observer.observe(template, { attributes: true });
}

const escapeHTML = (str) => str.replace(/([<>'"&])/g, (_, l) => `&#${l.charCodeAt(0)};`);

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
    reportLink.href = "https://scratchaddons.com/feedback";
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
    width: 600px;
    max-height: 270px;
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 5px;
    background-color: #0f1b27;
    color: white;
    z-index: 99999;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    text-shadow: none;
    box-shadow: 0 0 20px 0px #0000009e;
    line-height: 1em;`,
  });
  const notifImage = Object.assign(document.createElement("img"), {
    alt: chrome.i18n.getMessage("hexColorPickerAlt"),
    src: chrome.runtime.getURL("/images/cs/copy-comment-link.png"),
    style: "height: 120px; border-radius: 5px",
  });
  const notifText = Object.assign(document.createElement("div"), {
    id: "sa-notification-text",
    style: "margin: 12px;",
  });
  const notifTitle = Object.assign(document.createElement("span"), {
    style: "font-size: 18px; display: inline-block; margin-bottom: 12px;",
    textContent: chrome.i18n.getMessage("extensionUpdate"),
  });
  const notifClose = Object.assign(document.createElement("span"), {
    style: `
    float: right;
    cursor:pointer;
    background-color: #ffffff26;
    line-height: 10px;
    width: 10px;
    text-align: center;
    padding:5px;
    border-radius: 50%;`,
    title: chrome.i18n.getMessage("close"),
    textContent: "x",
  });
  notifClose.addEventListener("click", () => notifInnerBody.remove(), { once: true });

  const NOTIF_TEXT_STYLE = "display: block; font-size: 14px; color: white !important;";

  const notifInnerText0 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE + "font-weight: bold;",
    textContent: chrome.i18n
      .getMessage("extensionHasUpdated", DOLLARS)
      .replace(/\$(\d+)/g, (_, i) => [chrome.runtime.getManifest().version][Number(i) - 1]),
  });
  const notifInnerText1 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    innerHTML: escapeHTML(chrome.i18n.getMessage("extensionUpdateInfo1", DOLLARS)).replace(
      /\$(\d+)/g,
      (_, i) =>
        [
          Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("newFeature") }).outerHTML,
          Object.assign(document.createElement("b"), { textContent: chrome.i18n.getMessage("hexColorPicker") })
            .outerHTML,
          Object.assign(document.createElement("a"), {
            href: "https://scratch.mit.edu/scratch-addons-extension/settings",
            target: "_blank",
            textContent: chrome.i18n.getMessage("scratchAddonsSettings"),
          }).outerHTML,
        ][Number(i) - 1]
    ),
  });
  const notifInnerText2 = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
    innerHTML: escapeHTML(chrome.i18n.getMessage("extensionUpdateInfo2", DOLLARS)).replace(
      "$1",
      Object.assign(document.createElement("a"), {
        href: "https://scratchaddons.com/translate",
        target: "_blank",
        textContent: chrome.i18n.getMessage("helpTranslateScratchAddons"),
      }).outerHTML
    ),
  });
  const notifFooter = Object.assign(document.createElement("span"), {
    style: NOTIF_TEXT_STYLE,
  });
  const notifFooterChangelog = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/changelog?versionname=${chrome.runtime.getManifest().version}-notif`,
    target: "_blank",
    textContent: chrome.i18n.getMessage("changelog"),
    style: "text-transform: capitalize;", // Convert to title case
  });
  const notifFooterFeedback = Object.assign(document.createElement("a"), {
    href: `https://scratchaddons.com/feedback?version=${chrome.runtime.getManifest().version}-notif`,
    target: "_blank",
    textContent: chrome.i18n.getMessage("feedback"),
  });
  const notifFooterTranslate = Object.assign(document.createElement("a"), {
    href: "https://scratchaddons.com/translate",
    target: "_blank",
    textContent: chrome.i18n.getMessage("translate"),
  });
  const notifFooterLegal = Object.assign(document.createElement("small"), {
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

  notifInnerBody.appendChild(notifImage);
  notifInnerBody.appendChild(notifText);

  notifOuterBody.appendChild(notifInnerBody);

  document.body.appendChild(notifOuterBody);
};

const handleBanner = async () => {
  const currentVersion = chrome.runtime.getManifest().version;
  const [major, minor, patch] = currentVersion.split(".");
  const currentVersionMajorMinor = `${major}.${minor}`;
  // Making this configurable in the future?
  // Using local because browser extensions may not be updated at the same time across browsers
  const settings = await promisify(chrome.storage.local.get.bind(chrome.storage.local))(["bannerSettings"]);
  const force = !settings || !settings.bannerSettings;

  if (force || settings.bannerSettings.lastShown !== currentVersionMajorMinor) {
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
