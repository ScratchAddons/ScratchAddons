if (chrome.declarativeNetRequest) {
  // DNR available, use this instead
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
          domains: [chrome.runtime.id],
          regexFilter: "^https:\\/\\/(api\\.|clouddata\\.|)scratch\\.mit\\.edu\\/.*(\\?|\\&)sareferer",
          resourceTypes: ["xmlhttprequest"],
        },
      },
    ],
  });
} else {
  // DNR unavailable, falling back to webRequestBlocking
  // Used in Chrome < 96 (lacks DNRWithHostAccess) and Firefox
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
