<template>
  <div
    class="badge"
    v-if="shouldShow"
    :class="{
      tooltip: tagInfo.tooltipText,
      blue: tagInfo.color === 'blue',
      yellow: tagInfo.color === 'yellow',
      red: tagInfo.color === 'red',
      darkred: tagInfo.color === 'darkred',
      green: tagInfo.color === 'green',
      darkgreen: tagInfo.color === 'darkgreen',
      purple: tagInfo.color === 'purple',
    }"
  >
    {{ tagName }}
    <span v-if="tagInfo.tooltipText" class="tooltiptext">{{ tagTooltip }}</span>
  </div>
</template>
<script>
import tags from "../../data/tags.js";

const isIframe = window.parent !== window;

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
</script>
<style>
.badge {
  background: gray;
  color: var(--white-text);
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 12px;
  font-weight: 500;
  margin-inline-start: 10px;
  border-bottom: 2px solid #111;
  white-space: nowrap;
}
.badge .tooltiptext {
  white-space: normal;
}

.badge.blue {
  background: #175ef8;
  border-color: #0e44b8;
}
.badge.green {
  background: #78fd2b;
  color: #333;
  border-color: #53b31c;
}
.badge.yellow {
  background: #fddd2b;
  color: #333;
  border-color: #fdab12;
}
.badge.red {
  background: #fd662b;
  border-color: #d84a12;
}
.badge.darkred {
  background: #fd2b2b;
  border-color: #d81212;
}
.badge.darkgreen {
  background: #00b1a8;
  border-color: #047773;
}
.badge.purple {
  background: rgb(177, 23, 248);
  border-color: #b20eb8;
}
.filter-option.sel.blue {
  background: #175ef8;
}
.filter-option.sel.green {
  background: #78fd2b;
  color: #333;
}
.filter-option.sel.yellow {
  background: #fddd2b;
  color: #333;
}
.filter-option.sel.red {
  background: #fd662b;
}
.filter-option.sel.darkgreen {
  background: #00b1a8;
}
</style>
