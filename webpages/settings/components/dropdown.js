export default async function ({ template }) {
  const Dropdown = Vue.extend({
    props: ["buttonClass", "buttonTitle", "isDisabled", "alignStart"],
    template,
    data() {
      return {
        isOpen: false,
      };
    },
    methods: {
      toggle() {
        this.isOpen = !this.isOpen;
        this.$root.closePickers({ isTrusted: true }, null, {
          callCloseDropdowns: false,
        });
        this.$root.closeDropdowns({ isTrusted: true }, this); // close other dropdowns
      },
      listClick(e) {
        if (e.target.tagName === "LI") {
          this.$root.closeDropdowns();
        }
      }
    },
    events: {
      closeDropdowns(...params) {
        return this.$root.closeDropdowns(...params);
      },
    },
    ready() {
      this.$root.$on("close-dropdowns", (except) => {
        if (this.isOpen && except !== this) {
          this.isOpen = false;
        }
      });
    }
  });
  Vue.component("dropdown", Dropdown);
}
