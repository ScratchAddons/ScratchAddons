import cssVariables from "../../../../libraries/common/vue-css-variables.js";
import { textColor } from "../../../../libraries/common/cs/text-color.esm.js";

export default {
    props: ["options", "settingData", "settings"],
    computed: {
      colors() {
        const valueColor = this.settings.customValueColor ? this.settings.monitorValueBg : "#ff8c1a";
        return {
          monitorLabel: textColor(this.settings.monitor),
          value: valueColor,
          valueText: textColor(valueColor),
        };
      },
    },
    methods: {
      cssVariables,
    },
}
