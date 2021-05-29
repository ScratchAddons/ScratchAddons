export default async function ({ template }) {
  const AddonGroup = Vue.extend({
    props: ["group"],
    template,
    data() {
      return {};
    },
    computed: {
      shouldShow() {
        if (this.group.id === "new" && this.$root.searchInput !== "") return false;
        return this.shownCount > 0;
      },
      shownCount() {
        // Recompute after root loaded
        void this.$root.loaded;

        return this.$children.filter((addon) => addon.shouldShow).length;
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
  });
  Vue.component("addon-group", AddonGroup);
}
