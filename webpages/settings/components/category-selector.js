export default {
  name: "category-selector",
  props: ["category"],
  data() {
    return {};
  },
  computed: {
    selectedCategory() {
      return this.$settingsContext.selectedCategory;
    },
    shouldShow() {
      const categoriesWithParent = this.$settingsContext.categories
        .filter((category) => category.parent === this.category.parent)
        .map((category) => category.id);
      return !this.category.parent || [this.category.parent, ...categoriesWithParent].includes(this.selectedCategory);
    },
  },
  methods: {
    onClick(event) {
      event.stopPropagation();
      this.$settingsContext.selectedCategory = this.category.id;
    },
  },
};
