export default function ({ template }) {
  const SettingsPage = Vue.extend({
    template,
    data() {
      return {};
    },
    computed: {},
  });
  return { "settings-page": SettingsPage };
}
