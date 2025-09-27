export default async function ({ template }) {
  const Dropdown = Vue.extend({
    props: ["buttonClass", "buttonTitle", "disabled", "alignStart"],
    template,
    data() {
      return {
        isOpen: false,
        shiftAmountsByKey: {
          ArrowUp: -1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowRight: 1,
          Home: -Infinity,
          End: Infinity,
        },
      };
    },
    computed: {
      items() {
        return Array.from(this.$els.list.children);
      },
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
        if (e.target.closest("li")) {
          this.$root.closeDropdowns();
        }
      },
      handleKeys(e) {
        const element = this.$els.list;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === "Tab") {
          this.$root.closeDropdowns();
        } else if (document.activeElement.tagName === "LI" && e.key === "Enter") {
          document.activeElement.click();
        } else {
          const shiftBy = this.shiftAmountsByKey[e.key];
          if (shiftBy) e.preventDefault();
          else return;

          const oldFocusIndex = this.items.indexOf(document.activeElement);
          // Move,
          const adjustedFocusIndex = oldFocusIndex + shiftBy;
          // clamp,
          const newFocusIndex = Math.min(Math.max(adjustedFocusIndex, 0), element.childElementCount - 1);
          // set focus!
          const targetElement = element.children[newFocusIndex];
          targetElement.focus();
        }
      },
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
    },
  });
  Vue.component("dropdown", Dropdown);
}
