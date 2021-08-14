export default async function ({ template }) {
  const CategorySelector = Vue.extend({
    props: ["category"],
    template,
    data() {
      return {};
    },
    computed: {
      selectedCategory() {
        return settingsContext.selectedCategory;
      },
      shouldShow() {
        const categoriesWithParent = settingsContext.categories
          .filter((category) => category.parent === this.category.parent)
          .map((category) => category.id);
        return !this.category.parent || [this.category.parent, ...categoriesWithParent].includes(this.selectedCategory);
      },
    },
    methods: {
      onClick(event) {
        event.stopPropagation();
        settingsContext.selectedCategory = this.category.id;
      },
    },
  });
  return { "category-selector": CategorySelector };
}
