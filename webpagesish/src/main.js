import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import clickOutside from "./lib/click-outside.js";

const app = createApp(App)
app.directive("click-outside", clickOutside);

app.mount("#app");

