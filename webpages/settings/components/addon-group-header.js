export default {
  props: ["group", "shownCount", "marginAbove"],
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
};
