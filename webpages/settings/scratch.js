import handleSettings from "../../background/handle-settings-page.js";
import handleL10n from "../../background/handle-l10n.js";

const iframe = document.querySelector("iframe");

scratchAddons.localState.ready.i18n = scratchAddons.localState.ready.auth = true; // Not used nor loaded on this page

window.addEventListener("message", async (event) => {
  if (![iframe.contentWindow, window].includes(event.source) || event.data.reqId || !event.data?.message) return;

  function sendResponse(res = {}) {
    return event.source.postMessage({ res, reqId: `${event.data.id}r` }, event.origin);
  }

  const data = event.data.message;

  if (handleSettings(data, sendResponse) || handleL10n(data, sendResponse)) return;

  if (data.getFromStorage) return sendResponse(window.localStorage[`SCRATCHADDONS__${data.getFromStorage}`]);

  if (data.setInStorage) {
    window.localStorage[`SCRATCHADDONS__${data.setInStorage[0]}`] = JSON.stringify(data.setInStorage[1]);
    return sendResponse();
  }

  if (data.title) {
    document.title = data.title;

    return sendResponse();
  }

  if (data === "waitForState") {
    return scratchAddons.localState.allReady
      ? sendResponse()
      : scratchAddons.localEvents.addEventListener("ready", () => sendResponse());
  }

  if (data === "areListenersReady") return event.source.postMessage("listeners ready", event.origin);

  return sendResponse();
});

scratchAddons.localState.ready.listeners = true;
scratchAddons.localEvents.dispatchEvent(new CustomEvent("listeners ready"));

iframe.contentWindow.postMessage("listeners ready", "*");
