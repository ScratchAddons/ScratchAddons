try {
  if (window.parent.location.origin !== "https://scratch.mit.edu") throw "Scratch Addons: not first party iframe";
} catch {
  throw "Scratch Addons: not first party iframe";
}

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
    contentScriptInfo = request.contentScriptInfo;
  } else if (request === "getInitialUrl") {
    sendResponse(initialUrl);
  } else if (request.themesUpdated) {
    injectUserstylesAndThemes({ themes: request.themesUpdated, isUpdate: true });
  }
});
chrome.runtime.sendMessage("ready");
window.addEventListener("load", () => {
  if (!receivedContentScriptInfo) {
    // This might happen sometimes, the background page might not
    // have seen this tab loading, for example, at startup.
    chrome.runtime.sendMessage("sendContentScriptInfo");
  }
  chrome.storage.sync.get(['v1.5.0-banner'], function(result) {
    if (!result["v1.5.0-banner"]) {
      chrome.storage.sync.set({'v1.5.0-banner': true})
      const updateNotif = document.createElement("div");
      updateNotif.innerHTML = `
      <div id="sa-notification" style="position: fixed; bottom: 20px; right: 20px; width: 500px; max-height: 200px; display: flex; align-items: center; border: 1px solid white; padding: 8px; background-color: #333; color: white; z-index: 99999;     font-family: Arial;
      text-shadow: none;
      line-height: 1em;">
      <img src="${chrome.runtime.getURL("/images/onion.png")}" style="height: 125px;" />
      <div id="sa-notification-text" style="margin: 12px;">
          <span style="font-size: 18px;">${chrome.i18n.getMessage("extensionUpdate")}</span>
          <span title="Close" style="float: right; cursor:pointer;" onclick="document.querySelector('#sa-notification').style.display='none'"> x </span>
          <br /> <br />
          <span style="display: block; font-size: 14px;">
              <b>${chrome.i18n.getMessage("v1_5_0__1")}</b>${chrome.i18n.getMessage("v1_5_0__2")} <a href="https://scratch.mit.edu/scratch-addons-extension/settings" target="_blank">${chrome.i18n.getMessage("v1_5_0__3")}</a> ${chrome.i18n.getMessage("v1_5_0__4")}<br />
              <br />
              ${chrome.i18n.getMessage("v1_5_0__5")} <a href="https://scratchaddons.com/translate" target="_blank">${chrome.i18n.getMessage("v1_5_0__6")}</a><br />
              <br />
              <a href="https://scratchaddons.com/changelog?versionname=1.5.0" target="_blank">${chrome.i18n.getMessage("v1_5_0__7")}</a> | 
              <a href="https://scratchaddons.com/feedback?version=1.5.0-notif" target="_blank">${chrome.i18n.getMessage("feedback")}</a>
              <br />
              <small>${chrome.i18n.getMessage("v1_5_0__8")}</small>
          </span>
      </div>
    </div>
    
      `
      document.body.appendChild(updateNotif);
    }
  });
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
      if (isUpdate && css.startsWith("/* sa-autoupdate-theme-ignore */")) continue;
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
  for (const addonId in addonSettings) {
    for (const settingName in addonSettings[addonId]) {
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

function onHeadAvailable({ globalState, l10njson, addonsWithUserscripts, userstyleUrls, themes }) {
  setCssVariables(globalState.addonSettings);
  injectUserstylesAndThemes({ userstyleUrls, themes, isUpdate: false });

  const template = document.createElement("template");
  template.id = "scratch-addons";
  template.setAttribute("data-path", chrome.runtime.getURL(""));
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
    text1.innerHTML = escapeHTML(chrome.i18n.getMessage(key, "$1")).replace("$1", reportLink.outerHTML);
    addonError.appendChild(text1);
    errorList.appendChild(addonError);
  }
}
