export default async function ({ template }) {
  const CategorySelector = Vue.extend({
    props: ["category"],
    template,
    data() {
      return {};
    },
    computed: {
      selectedCategory() {
        return this.$root.selectedCategory;
      },
      shouldShow() {
        const categoriesWithParent = this.$root.categories
          .filter((category) => category.parent === this.category.parent)
          .map((category) => category.id);
        return !this.category.parent || [this.category.parent, ...categoriesWithParent].includes(this.selectedCategory);
      },
    },
    methods: {
      onClick(event) {
        event.stopPropagation();
        if (this.selectedCategory === this.category.id && !this.category.parent) {
          this.$root.selectedCategory = "all";
        } else {
          this.$root.selectedCategory = this.category.id;
        }
      },
    },
  });
  Vue.component("category-selector", CategorySelector);
}
