import handleSettings from "../../background/handle-settings-page.js";
import handleL10n from "../../background/handle-l10n.js";
import chrome from "../../libraries/common/chrome.js";
window.chrome = chrome;

const iframe = document.querySelector("iframe");

window.addEventListener("message", async (e) => {
  if (typeof e.data.reqId === "string" || (e.source !== iframe.contentWindow && e.source !== window) || !e.data.message)
    return;

  const promisify =
    (callbackFn) =>
    (...args) =>
      new Promise((resolve) => callbackFn(...args, resolve));

  function sendResponse(res = {}) {
    return e.source.postMessage({ res, reqId: e.data.id + "r" }, e.origin);
  }
  console.log("localStorage", localStorage);
  console.log("window.location", window.location);
  console.log("window.top", window.top);
  const data = e.data.message;

  if (handleSettings(data, sendResponse) || handleL10n(data, sendResponse)) return;

  if (data.getFromStorage) {
    return sendResponse(window.top.localStorage[data.getFromStorage]);
  }

  if (data.setInStorage) {
    return sendResponse((window.top.localStorage[data.setInStorage[0]] = JSON.stringify(data.setInStorage[1])));
  }

  if (data.title) {
    return sendResponse((document.title = window.top.document.title = data.title));
  }

  if (data === "waitForState") {
    if (scratchAddons.localState.allReady) {
      sendResponse();
    } else {
      scratchAddons.localEvents.addEventListener("ready", () => {
        sendResponse();
      });
    }
  }

  // data.changeAddonSettings todo

  return sendResponse(undefined);
});
