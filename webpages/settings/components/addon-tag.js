import tags from "../data/tags.js";

export default {
  props: ["tag"],
  data() {
    return {};
  },
  computed: {
    tagInfo() {
      // Might return undefined, tag might not exist
      return tags.find((tag) => tag.matchName === this.tag);
    },
    shouldShow() {
      if (this.$settingsContext.isInPopup) return this.tagInfo && this.tagInfo.iframeAlwaysShow;
      return (
        this.tagInfo &&
        (!this.tagInfo.addonTabShow || this.tagInfo.addonTabShow[this.$settingsContext.selectedCategory])
      );
    },
    tagName() {
      return chrome.i18n.getMessage(this.tagInfo.name);
    },
    tagTooltip() {
      return chrome.i18n.getMessage(this.tagInfo.tooltipText);
    },
  },
};
