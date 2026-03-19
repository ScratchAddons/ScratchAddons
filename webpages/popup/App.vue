<template>
    <div id="header">
      <div id="title">
        <img src="../../images/icon-transparent.svg" id="logo" alt="Logo" draggable="false" />
        <span id="title-text" v-cloak>
          {{ msg("extensionName") }}
          <a id="version" :href="changelogLink" target="_blank" title="{{ msg('changelog') }}">v{{ version }}</a>
        </span>
      </div>
      <a href="#" class="header-button" @click="openSettingsPage()">
        <img src="../../images/icons/settings.svg" id="settings-icon" title="{{ msg('settings') }}" draggable="false" />
      </a>
    </div>
    <div id="popup-bar" v-cloak>
      <button
        v-for="popup of popups"
        class="popup-name"
        :class="{ sel: currentPopup === popup }"
        @click="setPopup(popup)"
      >
        <img v-if="popup.icon" :src="popup.icon" class="popup-icon" draggable="false" />
        <a class="popup-title">{{ popup.name }}</a>
        <span v-if="popup.fullscreen" class="popout" @click="openInNewTab(popup)">
          <img
            src="../../images/icons/popout.svg"
            class="popout-img"
            title="{{ msg('openInNewTab') }}"
            draggable="false"
          />
        </span>
      </button>
    </div>
    <iframe
      v-cloak
      v-for="popup in popupsWithIframes"
      v-show="currentPopup === popup"
      :src="iframeSrc(popup._addonId)"
      :key="popup._addonId"
    ></iframe>
</template>
