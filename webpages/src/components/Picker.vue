<template>
  <div class="color-container" :key="value">
    <button
      :style="{ 'background-color': color }"
      class="setting-input color"
      :class="{ 'action-disabled': !addon._enabled, open: isOpen }"
      @click="toggle(addon, setting)"
    ></button>
    <form>
      <ColorPicker
        :color="color"
        :alpha-channel="alphaEnabled ? 'show' : 'hide'"
        v-show="isOpen"
        :dir="dir"
        @color-change="change"
      ></ColorPicker>
    </form>
  </div>
</template>
<script>
import getDirection from "../lib/rtl-list";
import bus from "../lib/eventbus";
import { ColorPicker } from "vue-accessible-color-picker";
import debounce from "../lib/debounce";
export default {
  components: { ColorPicker },
  // bind to the color prop and update addon settings
  props: ["addon", "setting", "modelValue", "alphaEnabled"],
  emits: ["update:modelValue"],
  computed: {
    dir() {
      return getDirection();
    },
  },
  data() {
    return {
      isOpen: false,
      canCloseOutside: false,
    };
  },

  computed: {
    color: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },

  mounted() {
    bus.$on("close-pickers", (except) => {
      if (this.isOpen && this !== except) {
        const addon = this.$parent.addon;
        const setting = this.$parent.setting;
        this.toggle(addon, setting, false, {
          // I trust callers
          callCloseDropdowns: false,
          callClosePickers: false,
        });
      }
    });
  },
  methods: {
    toggle(addon, setting, value = !this.isOpen, { callCloseDropdowns = true, callClosePickers = true } = {}) {
      this.isOpen = value;
      this.opening = true;
      if (callClosePickers)
        this.$root.closePickers({ isTrusted: true }, this, {
          callCloseDropdowns: false,
        });
      if (callCloseDropdowns) this.$root.closeResetDropdowns({ isTrusted: true }); // close other dropdowns
      this.opening = false;
      this.$parent.addonSettings[setting.id] = this.color;
      this.$parent.updateSettings(addon, { wait: 250, settingId: setting.id });

      this.canCloseOutside = false;
      setTimeout(() => {
        this.canCloseOutside = true;
      }, 0);
    },
    change: debounce(function (value) {
      const newColor = value.colors.hex;
      this.$parent.addonSettings[this.setting.id] = newColor;
      this.$parent.updateSettings(this.addon, { wait: 250, settingId: this.setting.id });

      this.color = newColor;
    }, 0),
  },
};
</script>
<style>
@import url('vue-accessible-color-picker/styles');
</style>
<style scoped>
form {
  position: absolute;
}
</style>
