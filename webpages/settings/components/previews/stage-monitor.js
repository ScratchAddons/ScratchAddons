import cssVariables from "../../../../libraries/common/vue-css-variables.js";
import { textColor } from "../../../../libraries/common/cs/text-color.esm.js";

export default async function ({ template }) {
  const StageMonitorPreview = Vue.extend({
    props: ["settings", "hoveredSettingId"],
    template,
    computed: {
      colors() {
        const variableValue = this.settings.customValueColor ? this.settings.monitorValueBg : "#ff8c1a";
        const listValue = this.settings.customValueColor ? this.settings.monitorValueBg : "#fc662c";
        return {
          monitorLabel: textColor(this.settings.monitor),
          listHeaderText: textColor(this.settings.listHeader),
          variableValue,
          variableValueText: textColor(variableValue),
          listValue,
          listValueText: textColor(listValue),
        };
      },
    },
    methods: {
      cssVariables,
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
  });
  Vue.component("preview-stage-monitor", StageMonitorPreview);
}
