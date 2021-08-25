import loadVueComponent from "../../libraries/common/load-vue-components.js";
import loadPopup from "../popup-loader.js";

const addonId = new URLSearchParams(location.search).get("addonId");

let components = await loadVueComponent([
  {
    url: `popups/${addonId}/popup`,
    params: await loadPopup(addonId),
  },
]);

new Vue({
  el: "body",
  components,
  data: { addonId },
});
