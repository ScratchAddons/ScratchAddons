export default {
    props: ["category"],
    template: document.querySelector("template#category-selector-component").innerHTML,
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
        this.$root.selectedCategory = this.category.id;
      },
    },
  }