let libraryLicenses = {};
let licenseNameToText = {};
fetch("/libraries/license-info.json")
  .then((res) => res.json())
  .then((o) => {
    libraryLicenses = o;
    return o;
  })
  .then((o) =>
    Object.values(o).map((name) =>
      fetch(`/libraries/licenses/${name}.txt`)
        .then((res) => res.text())
        .then((text) => ({ name, text }))
    )
  )
  .then((promises) => Promise.all(promises))
  .then((a) =>
    a.forEach(({ name, text }) => {
      licenseNameToText[name] = text;
    })
  );

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getLibraryInfo") {
    sendResponse(libraryLicenses);
  } else if (request.licenseName) {
    sendResponse({ licenseText: licenseNameToText[request.licenseName] });
  }
});
