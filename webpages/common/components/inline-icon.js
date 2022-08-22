export default async function ({ template }) {
  const InlineIcon = Vue.extend({
    props: ["icon", "id", "class", "title"],
    template,
    watch: {
      icon() {
        this.updateViewBox();
      },
    },
    attached() {
      this.updateViewBox();
    },
    methods: {
      updateViewBox() {
        // This attribute has to be set in JS or Vue would convert it to lowercase
        this.$el.setAttribute("viewBox", {
          adminUser: "0 0 512 512",
          brush2: "0 0 512 512",
          close: "0 0 16 16",
          code: "0 0 16 16",
          list: "0 0 1024 1024",
          people: "0 0 128 128",
          popup: "0 0 20 20",
          projectPage: "0 0 432 432",
        }[this.icon] || "0 0 24 24");
      }
    },
  });
  Vue.component("inline-icon", InlineIcon);
}
