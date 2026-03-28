import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);

app.directive("click-outside", {
  mounted: function (el, binding, vnode) {
    el.addEventListener("click", (e) => e.stopPropagation());
    el.controlled = binding.value.prevent;
    el.clickOutsideEvent = function (event) {
      // Check that click was outside the el and his children
      if (!(el === event.target || el.contains(event.target)) && !el.controlled) {
        // Call method provided in attribute value
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
