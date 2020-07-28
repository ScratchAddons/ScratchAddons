const extraInfoSpec = ["blocking", "requestHeaders"];
if (chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty("EXTRA_HEADERS")) extraInfoSpec.push("extraHeaders");

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        if(details.initiator !== `chrome-extension://${chrome.runtime.id}` 
        && details.initiator !== "https://scratch.mit.edu"
        && !details.originUrl.startsWith(chrome.runtime.getURL(""))
        && !details.originUrl.startsWith("https://scratch.mit.edu")) return;
        let originHeaderIndex = null;
        let interceptRequest = false;
        for(const i in details.requestHeaders) {
            const headerName = details.requestHeaders[i].name;
            if(headerName === "Origin") originHeaderIndex = i;
            else if(headerName === "X-ScratchAddons-Uses-Fetch") interceptRequest = true;
        }
        if(interceptRequest) {
            if(originHeaderIndex) details.requestHeaders.splice(originHeaderIndex, 1);
            details.requestHeaders.push({
                name: "Referer",
                value: "https://scratch.mit.edu/"
            });
            details.requestHeaders.push({
                name: "X-csrftoken",
                value: scratchAddons.globalState.auth.csrfToken
            });
            details.requestHeaders.push({
                name: "X-Token",
                value: scratchAddons.globalState.auth.xToken
            });
            details.requestHeaders.push({
                name: "X-Requested-With",
                value: "XMLHttpRequest"
            });
            return {
                requestHeaders: details.requestHeaders
            };
        }
    }, 
    {
        urls: ["https://*.scratch.mit.edu/*"],
        types: ["xmlhttprequest"]
    },
    extraInfoSpec);