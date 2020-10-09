let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] === "/") path += "/";
const pathArr = path.split("/");
if (pathArr[0] === "scratch-addons-extension") {
  if (pathArr[1] === "settings") chrome.runtime.sendMessage("openSettingsOnThisTab");
}

let receivedContentScriptInfo = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message from background]", request);
  if (request.contentScriptInfo) {
    sendResponse("OK");
    if (receivedContentScriptInfo) return;
    receivedContentScriptInfo = true;

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
    injectUserstylesAndThemes({ themes: request.themesUpdated });
  }
});

function injectUserstylesAndThemes({ userstyleUrls, themes }) {
  document.querySelectorAll(".scratch-addons-theme").forEach((style) => style.remove());
  for (const userstyleUrl of userstyleUrls || []) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = userstyleUrl;
    if (document.body) document.documentElement.insertBefore(link, document.body);
    else document.documentElement.appendChild(link);
  }
  for (const theme of themes) {
    // theme.addonId currently unutilized
    for (const css of theme.styles) {
      const style = document.createElement("style");
      style.classList.add("scratch-addons-theme");
      style.textContent = css;
      if (document.body) document.documentElement.insertBefore(style, document.body);
      else document.documentElement.appendChild(style);
    }
  }
}

function onHeadAvailable({ globalState, addonsWithUserscripts, userstyleUrls, themes }) {
  for (const addonId in globalState.addonSettings) {
    for (const settingName in globalState.addonSettings[addonId]) {
      const settingValue = globalState.addonSettings[addonId][settingName];
      if (typeof settingValue === "string" || typeof settingValue === "number")
        document.documentElement.style.setProperty(
          `--${addonId.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}-${settingName.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          )}`,
          globalState.addonSettings[addonId][settingName]
        );
    }
  }
  injectUserstylesAndThemes({ userstyleUrls, themes });

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
    if (request.newGlobalState) template.setAttribute("data-global-state", JSON.stringify(request.newGlobalState));
    else if (request.fireEvent) {
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
