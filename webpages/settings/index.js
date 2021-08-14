import loadVueComponent from "../../libraries/common/load-vue-components.js";

document.title = chrome.i18n.getMessage("settingsTitle");

(async () => {
  let components = await loadVueComponent(["webpages/settings/component"]);

  new Vue({ el: "body", components });
})();
