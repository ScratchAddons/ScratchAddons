import "../public/assets/main.css";
import "../public/assets/settings.css";

import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.directive("click-outside", {
  mounted: function (el, binding, vnode) {
    el.addEventListener("click", (e) => e.stopPropagation());
    el.addEventListener("click", (e) => e.stopPropagation());

    el.controlled = binding.value.prevent;

    el.clickOutsideEvent = function (event) {
      // here I check that click was outside the el and his children

      if (!(el == event.target || el.contains(event.target)) && !el.controlled) {
        // and if it did, call method provided in attribute value
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted: function (el) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
});
app.mount("#app");
