  export default {
    props: ["title"],
    methods: {
      closeModal() {
        this.$el.close();
      },
      msg(...params) {
        return this.$root.msg(...params);
      },
    },
}
