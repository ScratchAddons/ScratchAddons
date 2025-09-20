export default async function ({ template }) {
  const Modal = Vue.extend({
    props: ["isOpen", "title"],
    template,
    methods: {
      closeModal() {
        this.$el.close();
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
  });
  Vue.component("modal", Modal);
}
