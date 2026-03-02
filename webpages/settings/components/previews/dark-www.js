import cssVariables from "../../../../libraries/common/vue-css-variables.js";
import { textColor } from "../../../../libraries/common/cs/text-color.esm.js";

export default async function ({ template }) {
  const WebsiteDarkModePreview = Vue.extend({
    props: ["settings", "hoveredSettingId"],
    template,
    data() {
      return {
        footerColumns: [
          { titleLength: [5], linkLength: [5, 7] },
          { titleLength: [9], linkLength: [9, 10] },
          { titleLength: [9], linkLength: [5] },
          { titleLength: [5], linkLength: [5, 2, 3] },
          { titleLength: [7, 6], linkLength: [9] },
        ],
      };
    },
    computed: {
      colors() {
        return {
          pageText: textColor(this.settings.page),
          navbarText: textColor(this.settings.navbar),
          navbarBorder: textColor(this.settings.navbar, "rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)", 60),
          inputText: textColor(this.settings.input),
          footerText: textColor(this.settings.footer),
          greenBox: {
            off: "#328554",
            darker: "#064734",
            desaturated: "#27473e",
          }[this.settings.darkBanners],
        };
      },
    },
    methods: {
      cssVariables,
    },
  });
  Vue.component("preview-dark-www", WebsiteDarkModePreview);
}
