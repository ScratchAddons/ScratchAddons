import cssVariables from "../../../../libraries/common/vue-css-variables.js";
import { textColor } from "../../../../libraries/common/cs/text-color.esm.js";

export default async function ({ template }) {
  const StageMonitorPresetPreview = Vue.extend({
    props: ["options", "settingData", "settings"],
    template,
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
  });
  Vue.component("preview-stage-monitor-preset", StageMonitorPresetPreview);
}
