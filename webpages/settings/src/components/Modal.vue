<template>
  <div v-cloak v-show="isOpen" class="modal">
    <div class="modal-content" v-click-outside="clickOutside">
      <div>
        <img @click="isOpen = false" class="close" :title="msg('close')" src="../../../images/icons/close.svg" />
        <h1>{{ title }}</h1>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<style>
.modal {
  position: fixed;
  z-index: 100;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: var(--modal-overlay);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: var(--page-background);
  margin: auto;
  padding: 20px;
  width: 50rem;
  max-width: 75%;
  border-radius: 10px;
  height: 75%;
  display: flex;
  flex-direction: column;
}

.close {
  float: right;
  cursor: pointer;
  filter: var(--content-icon-filter);
}
[dir="rtl"] .close {
  float: left;
}
</style>
<script>
export default {
  props: ["modelValue", "title"],
  data() {
    return {
      canCloseOutside: false,
    };
  },
  watch: {
    modelValue(value) {
      if (value) {
        setTimeout(() => {
          this.canCloseOutside = true;
        }, 100);
      } else {
        this.canCloseOutside = false;
      }
    },
  },
  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },

  methods: {
    msg(...params) {
      return this.$root.msg(...params);
    },

    clickOutside(e) {
      if (this.isOpen && this.canCloseOutside && e.isTrusted) {
        this.isOpen = false;
      }
    },
  },
};
</script>
