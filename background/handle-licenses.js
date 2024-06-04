let libraryLicenses = {};
let licenseNameToText = {};
fetch("/libraries/license-info.json")
  .then((res) => res.json())
  .then((o) => {
    libraryLicenses = o;
    return o;
  })
  .then((o) =>
    Object.values(o).map((obj) =>
      fetch(`/libraries/licenses/${obj.filename ?? obj.license}.txt`)
        .then((res) => res.text())
        .then((text) => ({ obj, text }))
    )
  )
  .then((promises) => Promise.all(promises))
  .then((a) =>
    a.forEach(({ obj, text }) => {
      licenseNameToText[obj.filename ?? obj.license] = text;
    })
  );

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getLibraryInfo") {
    sendResponse(libraryLicenses);
  } else if (request.licenseName) {
    sendResponse({ rawLicenseText: licenseNameToText[request.licenseName] });
  }
});
