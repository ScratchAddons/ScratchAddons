const script = document.createElement("script");
script.type = "module";
script.src = chrome.runtime.getURL("content-scripts/inject/module.js");
document.head.appendChild(script);

const template = document.createElement("template");
template.id = "scratch-addons";
template.setAttribute("data-path", chrome.runtime.getURL(""));
document.head.appendChild(template);
const setGlobalState = (json) => template.setAttribute("data-global-state", JSON.stringify(json));

chrome.runtime.sendMessage("getGlobalState", setGlobalState);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Message from background]", request);
  if (request.newGlobalState) setGlobalState(request.newGlobalState);
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

chrome.runtime.sendMessage({ getUserscripts: { url: location.href } }, (res) => {
  template.setAttribute("data-userscripts", JSON.stringify(res));
});
