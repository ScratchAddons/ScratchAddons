import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
//import "vuetify/styles";
//import "vuetify/lib/components/VColorPicker/VColorPicker.css"
import { createVuetify } from "vuetify";

const vuetify = createVuetify({
});
createApp(App).use(vuetify).mount("#app");
