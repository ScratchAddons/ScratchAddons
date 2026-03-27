<template>
    <div class="navbar">
      <a href="./settings.html"
        ><img src="../../images/icon-transparent.svg" class="logo header-button" alt="Logo" draggable="false"
      /></a>
      <h1 v-cloak>{{ msg("licenses") }}</h1>
    </div>
    <div class="main">
      <div class="licenses-block">
        <h2 id="loading">{{ msg("loading") }}</h2>
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
import globalTheme from "../../libraries/common/global-theme.js";

globalTheme();
document.title = chrome.i18n.getMessage("licensesTitle");

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
  async mounted() {
    setTimeout(() => {
      const element = document.getElementById("loading");
      if (element) element.style.display = "block";
    }, 250);

    const libraryParam = new URLSearchParams(location.search).get("libraries");
    if (typeof libraryParam !== "string") throw new Error("Invalid libraries parameter");
    const libraries = libraryParam.split(",");

    const libraryLicenseInfo = await fetch("/libraries/license-info.json").then((res) => res.json());

    // Load the license text of each library to be displayed
    let licenses = [];
    for (const library of libraries) {
      const info = libraryLicenseInfo[library];
      if (info) licenses.push(info.filename ?? info.license);
    }
    licenses = [...new Set(licenses)]; // Remove duplicate values
    const licenseNameToText = {};
    await Promise.all(
      licenses.map((name) =>
        fetch(`/libraries/licenses/${name}.txt`)
          .then((res) => res.text())
          .then((text) => (licenseNameToText[name] = text))
      )
    );

    // Display the license of each library
    for (const library of libraries) {
      const info = libraryLicenseInfo[library];
      const licenseName = info.filename ?? info.license;
      if (!licenseName) continue;
      let licenseText = licenseNameToText[licenseName];
      licenseText = String(licenseText).replace(" [year]", info.year ? " " + info.year : "");
      licenseText = String(licenseText).replace(" [fullname]", info.fullname ? " " + info.fullname : "");
      licenseText = String(licenseText).replace(" ([email])", info.email ? " (" + info.email + ")" : "");
      this.libraries = [
        ...this.libraries,
        {
          name: library,
          license: licenseText,
        },
      ];
    }
    document.getElementById("loading").remove();
  },
};
</script>
