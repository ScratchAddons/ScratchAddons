// Remove Set-Cookie header that forces logout when they should not
chrome.webRequest.onHeadersReceived.addListener(
    details => ({
        responseHeaders: details.responseHeaders.filter(
            header => header.name.toLowerCase() !== 'set-cookie'
        )        
    }),
    {
        urls: ['https://scratch.mit.edu/site-api/comments/*'],
        types: ['xmlhttprequest', 'main_frame', 'image', 'sub_frame']
    },
    ['responseHeaders', 'blocking']
);