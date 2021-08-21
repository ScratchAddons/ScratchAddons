export default async function ({ template }) {
  const AddonGroup = Vue.extend({
    props: ["group", "shownCount", "marginAbove"],
    template,
    data() {
      return {};
    },
    computed: {
      shouldShow() {
        if (this.$settingsContext.searchInput !== "") return false;
        return this.shownCount > 0;
      },
      manifestsById() {
        return this.$settingsContext.manifestsById;
      },
    },
    methods: {
      toggle() {
        this.group.expanded = !this.group.expanded;
      },
    },
  });
  return { "addon-group-header": AddonGroup };
}
