export default async function ({ template }) {
  const InlineIcon = Vue.extend({
    props: ["icon", "class", "title"],
    template,
  });
  Vue.component("inline-icon", InlineIcon);
}
