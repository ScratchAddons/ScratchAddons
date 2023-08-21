const url = new URL(location.href);
const problem = url.searchParams.get("problem");
const $ = document.querySelector.bind(document);

if (problem === "unsupportedBrowser") {
  $("#problem-type").textContent = "Unsupported browser";
} else if (problem === "invalidManifest") {
  $("#problem-type").textContent = `Invalid JSON file: addons/${url.searchParams.get("addon")}/addon.json`;
}

const getVersion = () => {
  let userAgent = /(Firefox|Chrome)\/([0-9.]+)/.exec(navigator.userAgent);
  if (!userAgent) return { browser: null, version: null };
  return { browser: userAgent[1], version: userAgent[2].split(".")[0] };
};

const info = getVersion();
if (info.browser === "Chrome") info.browser = "Chrome/Edge/Brave/Chromium";
$("#browser-info").textContent = `${info.browser} ${info.version}`;
