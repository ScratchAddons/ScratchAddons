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
    },
    ready() {
      window.addEventListener(
        "hashchange",
        (event) => {
          if (this.group.addonIds.includes(location.hash?.substring(7))) {
            this.group.expanded = true;
          }
        },
        false
      );
    },
  });
  Vue.component("addon-group-header", AddonGroup);
}
