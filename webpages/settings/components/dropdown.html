<template>
  <div v-click-outside="closeDropdowns" @keydown="handleKeys">
    <button
      aria-haspopup="true"
      :aria-expanded="(isOpen) ? 'true' : 'false'"
      :class="['dropdown-btn', buttonClass, {'open': isOpen}]"
      :disabled="disabled"
      :title="buttonTitle"
      v-el:button
      @click="toggle"
    >
      <img src="../../images/icons/expand.svg" class="icon-type" draggable="false" />
    </button>
    <ul class="dropdown-list" :class="{'align-start': alignStart}" @click="listClick" role="menu" v-el:list>
      <slot></slot>
    </ul>
  </div>
</template>

<style>
  .dropdown-parent {
    position: relative;
  }

  .dropdown-list {
    position: absolute;
    top: calc(100% - 1px);
    right: 0;
    margin: 0;
    padding: 6px 0;
    display: none;
    z-index: 3;
    border-radius: 4px;
    border-top-right-radius: 0;
    background: var(--button-background);
    color: var(--content-text);
    border: 1px solid var(--control-border);
  }

  .dropdown-btn.open + ul {
    display: block;
  }

  .dropdown-list li {
    padding: 6px 12px;
    list-style: none;
    white-space: nowrap;
    text-align: start;
    transition: 0.2s ease;
    user-select: none;
  }

  .dropdown-list li:hover {
    background: var(--button-hover-background);
  }

  .dropdown-list.align-start {
    right: auto;
    left: 0;
    border-radius: 4px;
    border-top-left-radius: 0;
  }

  [dir="rtl"] .dropdown-list.align-start {
    left: auto;
    right: 0;
    border-top-left-radius: 4px;
    border-top-right-radius: 0;
  }
</style>
