<template>
  <div class="navbar">
    <a href="./index.html"><img src="../../images/icon-transparent.svg" class="logo" alt="Logo" /></a>
    <h1 v-cloak>{{ msg("permissions") }}</h1>
  </div>
  <div v-cloak class="main">
    <div class="permissions-block">
      <h2>{{ msg("enablePermissionsTitle") }}</h2>
      <p>{{ msg("enablePermissionsDescription") }}</p>
    </div>
    <div class="permissions-steps">
      <div>
        <button id="permissionsBtn" class="large-button">{{ msg("enableButton") }}</button>
        <p>{{ msg("enableButtonDescription") }}</p>
      </div>
      <div>
        <img alt="{{ msg('permissionsScreenAlt') }}" id="screenshot" v-bind:src="screenshotPath" />
        <p>{{ msg("clickAllowDescription") }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import globalTheme from "../../libraries/common/global-theme.js";

export default {
  data() {
    return { screenshotPath: "../../images/screenshots/permissions-dark.png" };
  },
  methods: {
    msg(message, ...param) {
      return chrome.i18n.getMessage(message, ...param);
    },
  },
  mounted() {
    self = this;
    globalTheme().then(({ theme }) => {
      if (theme) {
        self.screenshotPath = "../../images/screenshots/permissions-light.png";
      }
    });

    document.title = chrome.i18n.getMessage("permissionsTitle");

    const promisify =
      (callbackFn) =>
      (...args) =>
        new Promise((resolve) => callbackFn(...args, resolve));

    const MANIFEST_VERSION = 3;

    document.getElementById("permissionsBtn").addEventListener("click", async () => {
      const HOST_PERMISSIONS_KEY_NAME = MANIFEST_VERSION === 2 ? "permissions" : "host_permissions";

      const manifest = chrome.runtime.getManifest();
      const origins = manifest[HOST_PERMISSIONS_KEY_NAME].filter((url) => url.startsWith("https://"));

      const granted = await promisify(chrome.permissions.request)({ origins });
      if (granted) {
        return chrome.runtime.reload();
      }
      alert(chrome.i18n.getMessage("permissionsDenied"));
    });
  },
};
</script>
