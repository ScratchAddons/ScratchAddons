export default async function ({ template }) {
  const AddonGroup = Vue.extend({
    props: ["group", "shownCount", "marginAbove"],
    template,
    data() {
      return {};
    },
    computed: {
      shouldShow() {
        if (this.$root.searchInput !== "") return false;
        return this.shownCount > 0;
      },
      manifestsById() {
        return this.$root.manifestsById;
      },
    },
    methods: {
      toggle() {
        this.group.expanded = !this.group.expanded;
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
  });
  Vue.component("addon-group-header", AddonGroup);
}
