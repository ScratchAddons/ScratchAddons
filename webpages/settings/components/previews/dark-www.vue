<template>
  <div
    role="presentation"
    class="wdm-preview"
    :data-setting-hovered="hoveredSettingId"
    @mouseenter="$emit('areahover', 'page')"
    @mouseleave="$emit('areahover', null)"
    :style="cssVariables({
      '--page': settings.page,
      '--page-text': colors.pageText,
      '--navbar': settings.navbar,
      '--navbar-text': colors.navbarText,
      '--navbar-border': colors.navbarBorder,
      '--box': settings.box,
      '--gray': settings.gray,
      '--blue': settings.blue,
      '--input': settings.input,
      '--input-text': colors.inputText,
      '--button': settings.button,
      '--link': settings.link,
      '--footer': settings.footer,
      '--footer-text': colors.footerText,
      '--border': hoveredSettingId === 'border' ? 'var(--orange)' : settings.border,
      '--message-count': settings.messageIndicatorColor,
      '--message-count-on-messages-page': settings.messageIndicatorOnMessagesPage,
      '--green-box': colors.greenBox,
    })"
  >
    <div
      class="wdm-inner wdm-navbar"
      @mouseenter="$emit('areahover', 'navbar')"
      @mouseleave="$emit('areahover', 'page')"
    >
      <div class="wdm-logo-placeholder"></div>
      <div class="wdm-text-placeholder" style="--length: 6"><!-- Create --></div>
      <div class="wdm-text-placeholder" style="--length: 7"><!-- Explore --></div>
      <div class="wdm-text-placeholder" style="--length: 5"><!-- Ideas --></div>
      <div class="wdm-text-placeholder" style="--length: 5"><!-- About --></div>
      <div class="wdm-navbar-search">
        <div class="wdm-icon-placeholder"></div>
        <div class="wdm-text-placeholder" style="--length: 6"><!-- Search --></div>
      </div>
      <div class="wdm-messages-icon-container">
        <div class="wdm-icon-placeholder"><!-- Messages --></div>
        <div
          class="wdm-message-count"
          @mouseenter="$emit('areahover', 'messageIndicatorColor')"
          @mouseleave="$emit('areahover', 'navbar')"
        ></div>
      </div>
      <div class="wdm-icon-placeholder"><!-- My Stuff --></div>
      <div class="wdm-navbar-account">
        <div class="wdm-avatar-placeholder"></div>
        <div class="wdm-text-placeholder" style="--length: 10"><!-- Account --></div>
      </div>
    </div>
    <div class="wdm-inner wdm-main">
      <div>
        <div class="wdm-section-header">
          <div class="wdm-text-placeholder" style="--length: 8"></div>
          <div
            class="wdm-icon-placeholder wdm-message-count-on-messages-page"
            @mouseenter="$emit('areahover', 'messageIndicatorOnMessagesPage')"
            @mouseleave="$emit('areahover', 'page')"
          ></div>
        </div>
        <div
          class="wdm-box wdm-box-green"
          @mouseenter="$emit('areahover', 'darkBanners')"
          @mouseleave="$emit('areahover', 'page')"
        ></div>
        <div
          v-for="_ of [1, 2]"
          class="wdm-box wdm-box-blue"
          @mouseenter="$emit('areahover', 'blue')"
          @mouseleave="$emit('areahover', 'page')"
        ></div>
      </div>
      <div>
        <div class="wdm-section-header">
          <div class="wdm-text-placeholder" style="--length: 4"></div>
          <div class="wdm-text-placeholder" style="--length: 4"></div>
          <div class="wdm-text-placeholder" style="--length: 5"></div>
          <div
            class="wdm-button"
            @mouseenter="$emit('areahover', 'button')"
            @mouseleave="$emit('areahover', 'page')"
          ></div>
        </div>
        <div
          v-for="_ of [1, 2]"
          class="wdm-box wdm-box-white"
          @mouseenter="$emit('areahover', 'box')"
          @mouseleave="$emit('areahover', 'page')"
        >
          <div
            class="wdm-box-header"
            @mouseenter="$emit('areahover', 'gray')"
            @mouseleave="$emit('areahover', 'box')"
          ></div>
        </div>
      </div>
    </div>
    <div
      class="wdm-inner wdm-footer"
      @mouseenter="$emit('areahover', 'footer')"
      @mouseleave="$emit('areahover', 'page')"
    >
      <div class="wdm-footer-columns">
        <div v-for="column of footerColumns">
          <div class="wdm-footer-column-title">
            <div
              v-for="wordLength of column.titleLength"
              class="wdm-text-placeholder"
              :style="cssVariables({ '--length': wordLength })"
            ></div>
          </div>
          <div class="wdm-footer-link">
            <div
              v-for="wordLength of column.linkLength"
              class="wdm-text-placeholder"
              :style="cssVariables({ '--length': wordLength })"
            ></div>
          </div>
        </div>
      </div>
      <div
        class="wdm-footer-language"
        @mouseenter="$emit('areahover', 'input')"
        @mouseleave="$emit('areahover', 'footer')"
      >
        <div class="wdm-text-placeholder" style="--length: 8"><!-- Language --></div>
      </div>
    </div>
  </div>
</template>

<style>
  .wdm-preview {
    margin-top: 10px;
    width: 512px;
    height: 300px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: var(--page);
    border: 1px solid var(--control-border);
    border-radius: 4px;
  }
  .wdm-inner {
    padding-inline: 22px;
  }
  .wdm-preview * {
    transition:
      box-shadow 0.2s ease,
      filter 0.2s ease,
      border-color 0.2s ease;
  }

  .wdm-preview[data-setting-hovered="page"] .wdm-main,
  .wdm-preview[data-setting-hovered="navbar"] .wdm-navbar,
  .wdm-preview[data-setting-hovered="box"] .wdm-box-white,
  .wdm-preview[data-setting-hovered="gray"] .wdm-box-header,
  .wdm-preview[data-setting-hovered="blue"] .wdm-box-blue,
  .wdm-preview[data-setting-hovered="input"] .wdm-footer-language,
  .wdm-preview[data-setting-hovered="footer"] .wdm-footer,
  .wdm-preview[data-setting-hovered="darkBanners"] .wdm-box-green {
    box-shadow: 0 0 8px inset var(--orange);
  }
  .wdm-preview[data-setting-hovered="button"] .wdm-button,
  .wdm-preview[data-setting-hovered="link"] .wdm-footer-link,
  .wdm-preview[data-setting-hovered="messageIndicatorOnMessagesPage"] .wdm-message-count-on-messages-page {
    filter: drop-shadow(0 0 4px var(--orange));
  }
  .wdm-preview[data-setting-hovered="messageIndicatorColor"] .wdm-message-count {
    filter: drop-shadow(0 0 4px var(--blue));
  }

  .wdm-icon-placeholder {
    width: 10px;
    height: 10px;
    background-color: currentColor;
    border-radius: 5px;
    opacity: 0.75;
  }
  .wdm-text-placeholder {
    width: calc(3px * var(--length));
    min-width: 4px;
    height: 4px;
    background-color: currentColor;
    border-radius: 2px;
    opacity: 0.75;
  }
  .wdm-icon-placeholder + .wdm-text-placeholder,
  .wdm-text-placeholder + .wdm-text-placeholder {
    margin-inline-start: 3px;
  }

  .wdm-navbar {
    height: 25px;
    display: flex;
    align-items: center;
    background-color: var(--navbar);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
    color: var(--navbar-text);
  }
  .wdm-logo-placeholder {
    margin-inline-start: 1px;
    margin-inline-end: 4px;
    width: 38px;
    height: 14px;
    box-sizing: border-box;
    background-color: #f9a83a;
    border: 3.5px solid white;
    border-radius: 7px;
  }
  .wdm-navbar > .wdm-text-placeholder,
  .wdm-navbar > .wdm-icon-placeholder,
  .wdm-messages-icon-container {
    margin: 0 8px;
  }
  .wdm-navbar-search {
    flex-grow: 1;
    margin: 10px;
    height: 20px;
    display: flex;
    align-items: center;
    padding: 0 5px;
    background-color: var(--navbar-border);
    border-radius: 3px;
  }
  .wdm-messages-icon-container {
    position: relative;
  }
  .wdm-message-count {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background-color: var(--message-count);
    border-radius: 4px;
  }
  [dir="rtl"] .wdm-message-count {
    right: auto;
    left: -4px;
  }
  .wdm-navbar-account {
    margin: 0 8px;
    display: flex;
    align-items: center;
  }
  .wdm-avatar-placeholder {
    margin-inline-end: 5px;
    width: 12px;
    height: 12px;
    border: 1px solid var(--navbar-border);
    border-radius: 3px;
  }

  .wdm-main {
    flex-grow: 1;
    display: flex;
    padding-block: 10px;
    color: var(--page-text);
  }
  .wdm-main > div {
    flex-grow: 1;
    flex-basis: 0;
    display: flex;
    flex-direction: column;
  }
  .wdm-main > div + div {
    margin-inline-start: 10px;
  }

  .wdm-section-header {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
  }
  .wdm-message-count-on-messages-page {
    margin-inline-start: 8px;
    background-color: var(--message-count-on-messages-page);
    opacity: 1;
  }
  .wdm-button {
    margin-inline-start: auto;
    width: 40px;
    height: 10px;
    background-color: var(--button);
    border-radius: 3px;
  }
  .wdm-box {
    flex-grow: 1;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 5px;
  }
  .wdm-box + .wdm-box {
    margin-top: 10px;
  }
  .wdm-box-green {
    background-color: var(--green-box);
  }
  .wdm-box-blue {
    background-color: var(--blue);
  }
  .wdm-box-white {
    background-color: var(--box);
  }
  .wdm-box-header {
    height: 19px;
    background-color: var(--gray);
    border-bottom: 1px solid var(--border);
  }

  .wdm-footer {
    padding-block: 11px;
    background-color: var(--footer);
    color: var(--footer-text);
  }
  .wdm-footer-columns {
    display: flex;
    justify-content: space-between;
  }
  .wdm-footer-column-title {
    margin-bottom: 4px;
    display: flex;
  }
  .wdm-footer-link {
    display: flex;
    color: var(--link);
  }
  .wdm-footer-language {
    margin-inline: auto;
    margin-top: 14px;
    width: 108px;
    height: 22px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    background-color: var(--input);
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--input-text);
  }
</style>
