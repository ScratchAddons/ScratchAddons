import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

const app = createApp(App);

app.directive("click-outside", {
  mounted(el, binding) {
    el._clickOutsideStop = (e) => e.stopPropagation();
    el._clickOutside = (event) => binding.value(event);
    el.addEventListener("mousedown", el._clickOutsideStop);
    document.body.addEventListener("mousedown", el._clickOutside);
  },
  unmounted(el) {
    el.removeEventListener("mousedown", el._clickOutsideStop);
    document.body.removeEventListener("mousedown", el._clickOutside);
  },
});

app.mount("#app");
