  export default {
    props: ["title"],
    methods: {
      openModal() {
        this.$el.showModal();
      },
      closeModal() {
        this.$el.close();
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
}
