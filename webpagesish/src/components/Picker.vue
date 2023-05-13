<template>
  <div class="color-container" :key="value">
    <button
      :style="{ 'background-color': color }"
      class="setting-input color"
      :class="{ 'action-disabled': !addon._enabled, open: isOpen }"
      @click="toggle(addon, setting)"
    ></button>
    <v-color-picker v-model="color" id="picker" v-show="isOpen" dir="ltr"></v-color-picker>
  </div>
</template>
<script>
export default {
  // bind to the color prop and update addon settings
  props: ["addon", "setting", "value"],
  data() {
    return {
      isOpen: false,
      color: this.value,
      noAlphaString: "true",
    };
  },
  watch: {
    color(value) {
      console.log("color changed", value);
      this.$parent.addonSettings[this.setting.id] = value;
      this.$parent.updateSettings(this.addon, { wait: 250, settingId: this.setting.id });
    },
  },
  // write method to toggle the color picker
  methods: {
    toggle(addon, setting) {
      this.isOpen = !this.isOpen;
      // close all other popups and dropdowns
      this.$root.closePickers({ isTrusted: true }, null, {
        callCloseDropdowns: false,
      });
      this.$root.closeResetDropdowns({ isTrusted: true }, null, {
        callCloseDropdowns: false,
      });
    },
    change(value) {
      console.log("change", value);
      this.color = value;
    },
  },
};
</script>
