<template>
  <div class="color-container" @click="open" @mouseover="load = true">
    <button
      :style="{'background-color': color }"
      class="setting-input color"
      :class="{'action-disabled': !addon._enabled, 'open': isOpen }"
      :disabled="disabled"
    ></button>

    <div v-if="load" v-show="isOpen" class="picker-popup">
      <Chrome
        v-model:modelValue="color"
        :disable-alpha="no_alpha"
        @update:modelValue="onColorChange"
      />
    </div>
  </div>
</template>

<script>
import { Chrome } from "@lk77/vue3-color";
import bus from "../lib/eventbus";

export default {
  components: { Chrome },
  props: ["value", "addon", "setting", "no_alpha", "disabled"],
  data() {
    return {
      load: false,
      isOpen: false,
      color: this.value,
    };
  },
  mounted() {
    bus.$on("close-pickers", (except) => {
      if (this.isOpen && this !== except) {
        this.close(false);
      }
    });
  },

  watch: {
    value(newVal) {
      this.color = newVal;
    },
  },

  methods: {
    open() {
      if (!this.load) return;
      this.isOpen = true;
      this.$root.closePickers({ isTrusted: true }, this, {
        callCloseDropdowns: false,
      });
      this.$root.closeDropdowns({ isTrusted: true });
    },

    close(callBus = true) {
      this.isOpen = false;
      if (callBus) bus.$emit("close-pickers", this);
    },

    onColorChange(newColor) {
      const hex = this.no_alpha ? newColor.hex : newColor.hex8;
      this.color = hex;

      if (this.value !== this.color) {
        this.$parent.addonSettings[this.setting.id] = this.color;
        this.$parent.updateSettings(this.addon, {
          wait: 250,
          settingId: this.setting.id,
        });
      }
    },
  },
};
</script>

<style>
.color-container {
  position: relative;
}

.picker-popup {
  z-index: 2;
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  border: 1px solid var(--control-border);
}

.picker-popup .vc-chrome-body,
.picker-popup .vc-chrome-fields .vc-input__input {
  background-color: var(--button-background);
  font-family: Roboto, sans-serif;
}

.picker-popup .vc-chrome-fields .vc-input__input,
.picker-popup .vc-chrome-fields .vc-input__label {
  color: var(--content-text);
}

.picker-popup .vc-chrome-fields .vc-input__input {
  box-shadow: inset 0 0 0 1px var(--content-border);
}

.picker-popup .vc-chrome-toggle-icon {
  filter: var(--content-icon-filter);
}

.picker-popup .vc-chrome-toggle-icon-highlight {
  background: var(--hover-highlight);
}
</style>
