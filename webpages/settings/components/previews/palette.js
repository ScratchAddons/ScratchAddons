export default {
  name: "preview-palette",
  props: ["options", "settingData", "settings"],
  methods: {
    settingName(id) {
      return this.settingData.find((setting) => setting.id === id).name;
    },
  },
};
