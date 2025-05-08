import cssVariables from "../../../../libraries/common/vue-css-variables.js";

export default async function ({ template }) {
  const CompactMessagesPreview = Vue.extend({
    props: ["settings", "hoveredSettingId"],
    template,
    methods: {
      cssVariables,
    },
  });
  Vue.component("preview-compact-messages", CompactMessagesPreview);
}
