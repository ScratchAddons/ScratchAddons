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

.footer {
  text-align: center;
  color: var(--gray-text);
  margin-top: auto;
}
.footer a {
  color: var(--gray-text);
}
.settings-block {
  margin-top: 20px;
  overflow-y: auto;
}
.more-settings .large-button {
  display: block;
  margin-inline-end: 10px;
}
.more-settings .filter-selector {
  margin: 0;
}
.more-settings .addon-body,
.more-settings .addon-setting {
  margin-inline: 0;
}
.more-settings .addon-body:first-child {
  margin-top: 0;
}
.more-settings .addon-body:last-child {
  margin-bottom: 0;
}
.more-settings .addon-topbar {
  height: 36px;
  border-bottom: 1px solid var(--content-border);
}
.more-settings .addon-name {
  margin-inline-start: 10px;
}
.more-settings .addon-settings {
  padding: 10px;
  padding-bottom: 0;
}
</style>
<script>
export default {
  props: ["modelValue", "title"],
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

  },
};
</script>
