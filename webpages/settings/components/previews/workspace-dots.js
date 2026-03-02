export default async function ({ template }) {
  const WorkspaceDotsPreview = Vue.extend({
    props: ["settings", "hoveredSettingId"],
    template,
    computed: {
      spacing() {
        return 27 / this.settings.spacingDivisor;
      },
      lineWidth() {
        // See definition of setLineAttributes_() in addons/workspace-dots/userscript.js
        return (
          {
            dots: 0.675,
            crosshairs: this.spacing / 2.5,
            lines: this.spacing + 1,
            vertical: this.spacing + 1,
            horizontal: this.spacing + 1,
          }[this.settings.theme] || 0
        );
      },
    },
  });
  Vue.component("preview-workspace-dots", WorkspaceDotsPreview);
}
