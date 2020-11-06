let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] === "/") path += "/";
const pathArr = path.split("/");
if (pathArr[0] === "scratch-addons-extension") {
  if (pathArr[1] === "settings") chrome.runtime.sendMessage("openSettingsOnThisTab");
}
if (path === "discuss/3/topic/add//") window.addEventListener("load", forumWarning);

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
      observer.observe(document.documentElement, { subtree: true });
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
    for (const css of theme.styles) {
      if (isUpdate && css.startsWith("/* sa-autoupdate-theme-ignore */")) continue;
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

function onHeadAvailable({ globalState, addonsWithUserscripts, userstyleUrls, themes }) {
  setCssVariables(globalState.addonSettings);
  injectUserstylesAndThemes({ userstyleUrls, themes, isUpdate: false });

  const template = document.createElement("template");
  template.id = "scratch-addons";
  template.setAttribute("data-path", chrome.runtime.getURL(""));
  template.setAttribute("data-userscripts", JSON.stringify(addonsWithUserscripts));
  template.setAttribute("data-global-state", JSON.stringify(globalState));
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
    } else if (request.setMsgCount) {
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

function forumWarning() {
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
    reportLink.innerText = "report it here";
    let text1 = document.createElement("span");
    text1.innerText =
      "Message added by the Scratch Addons extension: make sure the bug you're about to report still happens when " +
      "all browser extensions are disabled, including Scratch Addons. If you believe a bug is caused by Scratch Addons, please ";
    let text3 = document.createElement("span");
    text3.innerText = ".";
    addonError.appendChild(text1);
    addonError.appendChild(reportLink);
    addonError.appendChild(text3);
    errorList.appendChild(addonError);
  }
}
