export default async function ({ template }) {
  const Modal = Vue.extend({
    props: ["isOpen", "title"],
    template,
    data() {
      return {
        canCloseOutside: false,
      };
    },
    watch: {
      isOpen(value) {
        if (value) {
          setTimeout(() => {
            this.canCloseOutside = true;
          }, 100);
        } else {
          this.canCloseOutside = false;
        }
      },
    },
    methods: {
      msg(...params) {
        return this.$root.msg(...params);
      },
      close() {
        this.$emit("close");
      },
    },
    events: {
      clickOutside(e) {
        if (this.isOpen && this.canCloseOutside && e.isTrusted) {
          this.close();
        }
      },
    },
  });
  Vue.component("modal", Modal);
}
