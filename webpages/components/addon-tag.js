export default {
  props: ["tag"],
  template: await (await fetch("addon-tag.html")).text(),
  data() {
    return {};
  },
  computed: {
    tagInfo() {
      // Might return undefined, tag might not exist
      return tags.find((tag) => tag.matchName === this.tag);
    },
    shouldShow() {
      if (isIframe) return this.tagInfo && this.tagInfo.iframeAlwaysShow;
      return this.tagInfo && (!this.tagInfo.addonTabShow || this.tagInfo.addonTabShow[this.$root.selectedCategory]);
    },
    tagName() {
      return chrome.i18n.getMessage(this.tagInfo.name);
    },
    tagTooltip() {
      return chrome.i18n.getMessage(this.tagInfo.tooltipText);
    },
  },
};
