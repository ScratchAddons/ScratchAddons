export default async function ({ addon, global, console, msg }) {
  // dynamicEnable/disable is pretty hacky in background
  let main = ({ url }) => {
    let newURL = url.replace(/\/discuss\/m\/(.*)/g, "/discuss/$1");
    return {
      redirectUrl: newURL,
    };
  };

  chrome.webRequest.onBeforeRequest.addListener(
    main,
    { urls: ["https://scratch.mit.edu/discuss/m/*"], types: ["main_frame"] },
    ["blocking"]
  );

  addon.self.addEventListener("disabled", () => chrome.webRequest.onBeforeRequest.removeListener(main));
  addon.self.addEventListener("reenabled", () =>
    chrome.webRequest.onBeforeRequest.addListener(
      main,
      { urls: ["https://scratch.mit.edu/discuss/m/*"], types: ["main_frame"] },
      ["blocking"]
    )
  );
}
