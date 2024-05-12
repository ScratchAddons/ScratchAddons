if (chrome.declarativeNetRequest) {
  // DNR available, use this instead

  const baseUrl = new URL(chrome.runtime.getURL(""));
  const initiatorDomains = {
    // `domains` is deprecated and wasn't implemented by Firefox, but it's the only
    // option for Chrome 96-100 support.
    [baseUrl.protocol === "moz-extension:" ? "initiatorDomains" : "domains"]: [baseUrl.host],
    // `baseUrl.host` is equivalent to `chrome.runtime.id` in Chrome. In Firefox, it's
    // the extension id that is used in URLs (not the one specified in manifest.json)
  };

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "Referer",
              operation: "set",
              value: "https://scratch.mit.edu/",
            },
          ],
        },
        condition: {
          ...initiatorDomains,
          regexFilter: "^https:\\/\\/(api\\.|clouddata\\.|)scratch\\.mit\\.edu\\/.*(\\?|\\&)sareferer",
          resourceTypes: ["xmlhttprequest"],
        },
      },
    ],
  });
} else {
  // DNR unavailable, falling back to webRequestBlocking
  // Used in Firefox < 113 (lacks DNR)
  const extraInfoSpec = ["blocking", "requestHeaders"];
  if (Object.prototype.hasOwnProperty.call(chrome.webRequest.OnBeforeSendHeadersOptions, "EXTRA_HEADERS"))
    extraInfoSpec.push("extraHeaders");

  chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
      if (details.originUrl) {
        // Firefox
        const origin = new URL(details.originUrl).origin;
        if (origin !== chrome.runtime.getURL("").slice(0, -1)) return;
      } else if (
        // Chrome
        details.initiator !== chrome.runtime.getURL("").slice(0, -1)
      )
        return;

      if (details.url.endsWith("?sareferer") || details.url.endsWith("&sareferer")) {
        details.requestHeaders.push({
          name: "Referer",
          value: "https://scratch.mit.edu/",
        });
        return {
          requestHeaders: details.requestHeaders,
        };
      }
    },
    {
      urls: ["https://scratch.mit.edu/*", "https://api.scratch.mit.edu/*", "https://clouddata.scratch.mit.edu/*"],
      types: ["xmlhttprequest"],
    },
    extraInfoSpec
  );
}
