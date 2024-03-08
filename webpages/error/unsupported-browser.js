const iframe = document.querySelector("iframe");

try {
  const uiLanguage = chrome.i18n.getUILanguage();
  const localeSlash = uiLanguage.startsWith("en") ? "" : `${uiLanguage.split("-")[0]}/`;
  iframe.src = `https://scratchaddons.com/${localeSlash}unsupported-browser/`;
} catch (err) {
  iframe.src = "https://scratchaddons.com/unsupported-browser/";
}

const IFRAME_ORIGIN = "https://scratchaddons.com";

window.onmessage = async (e) => {
  if (e.origin !== IFRAME_ORIGIN) return;

  const message = e.data;
  console.log("[SA] Message received by extension", message);

  if (message.msgType) {
    if (message.msgType === "getVersionInfo") {
      // Reply back to the website with the extension version
      iframe.contentWindow.postMessage({ versionInfo: chrome.runtime.getManifest().version }, IFRAME_ORIGIN);
    }
    if (message.msgType === "pageTitleInfo") {
      // Website wants us to set the tab title
      document.title = message.msgContent;
    }

    if (["exportSettingsAsFile", "openSettingsAsTab"].includes(message.msgType)) {
      // See webpages/settings/index.js for main import/export settings code
      const { serializeSettings } = await import("../settings/settings-utils.js");
      const downloadBlob = (await import("../../libraries/common/cs/download-blob.js")).default;

      // Export extension settings as a .json file
      if (message.msgType === "exportSettingsAsFile") {
        serializeSettings().then((serialized) => {
          const blob = new Blob([serialized], { type: "application/json" });
          downloadBlob("scratch-addons-settings.json", blob);
        });
      }

      // View settings file
      if (message.msgType === "openSettingsAsTab") {
        const openedWindow = window.open("about:blank");
        serializeSettings().then((serialized) => {
          const blob = new Blob([serialized], { type: "text/plain" });
          openedWindow.location.replace(URL.createObjectURL(blob));
        });
      }
    }
  }
};
