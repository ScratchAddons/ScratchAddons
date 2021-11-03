export default async function ({ template }) {
  const PalettePreview = Vue.extend({
    props: ["options", "settingData", "settings"],
    template,
    methods: {
      settingName(id) {
        return this.settingData.find((setting) => setting.id === id).name;
      },
    },
  });
  Vue.component("preview-palette", PalettePreview);
}
