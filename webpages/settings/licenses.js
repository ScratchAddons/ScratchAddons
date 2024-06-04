import globalTheme from "../../libraries/common/global-theme.js";

globalTheme();

const vue = new Vue({
  el: "body",
  data: {
    libraries: [],
  },
  methods: {
    msg(message, ...param) {
      return chrome.i18n.getMessage(message, ...param);
    },
  },
});

chrome.runtime.sendMessage("getLibraryInfo", (libraryLicenses) => {
  const licenseNameToText = {};
  const searchParams = new URL(location.href).searchParams;
  const libraryParam = searchParams.get("libraries");
  if (typeof libraryParam !== "string") return;
  const libraries = libraryParam.split(",");
  console.log(libraryLicenses, libraries);
  for (const library of libraries) {
    const licenseName = libraryLicenses[library].filename ?? libraryLicenses[library].license;
    if (!licenseName) continue;
    if (Object.prototype.hasOwnProperty.call(licenseNameToText, licenseName)) {
      vue.libraries = [
        ...vue.libraries,
        {
          name: library,
          license: licenseNameToText[licenseName],
        },
      ];
      continue;
    }
    chrome.runtime.sendMessage({ licenseName }, ({ rawLicenseText }) => {
      let licenseText = rawLicenseText;
      licenseText = String(licenseText).replace(
        " [year]",
        libraryLicenses[library].year ? " " + libraryLicenses[library].year : ""
      );
      licenseText = String(licenseText).replace(
        " [fullname]",
        libraryLicenses[library].fullname ? " " + libraryLicenses[library].fullname : ""
      );
      licenseText = String(licenseText).replace(
        " ([email])",
        libraryLicenses[library].email ? " (" + libraryLicenses[library].email + ")" : ""
      );
      licenseNameToText[licenseName] = licenseText;
      vue.libraries = [
        ...vue.libraries,
        {
          name: library,
          license: licenseText,
        },
      ];
    });
  }
});

document.title = chrome.i18n.getMessage("licensesTitle");
