<template>
  <div class="navbar">
    <a href="./index.html"><img src="../../../images/icon-transparent.svg" class="logo" alt="Logo" /></a>
    <h1 v-cloak>{{ msg("licenses") }}</h1>
  </div>
  <div class="main">
    <div class="licenses-block">
      <div class="license-container">
        <div v-cloak class="licenses-body" v-for="library of libraries">
          <h2>{{ msg("licensesForLibrary", library.name) }}</h2>
          <pre>{{ library.license }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import globalTheme from "../../../libraries/common/global-theme.js";

globalTheme();

export default {
  data() {
    return {
      libraries: [],
    };
  },
  methods: {
    msg(message, ...param) {
      return chrome.i18n.getMessage(message, ...param);
    },
  },
  mounted() {
    let self = this;
    chrome.runtime.sendMessage("getLibraryInfo", function (libraryLicenses) {
      const licenseNameToText = {};
      const searchParams = new URL(location.href).searchParams;
      const libraryParam = searchParams.get("libraries");
      if (typeof libraryParam !== "string") return;
      const libraries = libraryParam.split(",");
      console.log(libraryLicenses, libraries, self.libraries);
      for (const library of libraries) {
        const licenseName = libraryLicenses[library];
        if (!licenseName) continue;
        if (Object.prototype.hasOwnProperty.call(licenseNameToText, licenseName)) {
          self.libraries = [
            ...self.libraries,
            {
              name: library,
              license: licenseNameToText[licenseName],
            },
          ];
          continue;
        }
        chrome.runtime.sendMessage({ licenseName }, ({ licenseText }) => {
          licenseNameToText[licenseName] = licenseText;
          self.libraries = [
            ...self.libraries,
            {
              name: library,
              license: licenseText,
            },
          ];
        });
      }
    });
  },
};
document.title = chrome.i18n.getMessage("licensesTitle");
</script>
<style>
.licenses {
  height: 100%;
  min-height: 100vh;
  overflow-y: auto;
}

.licenses-block {
  padding: 2rem;
}

.licenses-body pre {
  white-space: pre-wrap;
}
</style>
