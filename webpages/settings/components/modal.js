export default async function ({ template }) {
  const Modal = Vue.extend({
    props: ["title"],
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
