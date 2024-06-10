import globalTheme from "../../libraries/common/global-theme.js";

globalTheme();
document.title = chrome.i18n.getMessage("licensesTitle");

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

setTimeout(() => {
  const element = document.getElementById("loading");
  if (element) element.style.display = "block";
}, 250);

const libraryParam = new URLSearchParams(location.search).get("libraries");
if (typeof libraryParam !== "string") throw new Error("Invalid libraries parameter");
const libraries = libraryParam.split(",");

const libraryLicensesList = await fetch("/libraries/license-info.json").then((res) => res.json());

// Load the license text of each library to be displayed
let licenses = [];
for (const library of libraries) {
  if (libraryLicensesList[library]) licenses.push(libraryLicensesList[library]);
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
  const licenseName = libraryLicensesList[library];
  if (!licenseName) continue;
  vue.libraries = [
    ...vue.libraries,
    {
      name: library,
      license: licenseNameToText[licenseName],
    },
  ];
}

document.getElementById("loading").remove();
