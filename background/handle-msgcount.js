let lastCheckTimestamp = null;
let lastCheckUsername = null;
let lastMsgCount = null;

// Expose method to Account class
scratchAddons.methods.getMsgCount = async function() {
    const username = scratchAddons.globalState.auth.username;
    if(!username) {
        lastMsgCount = null;
        lastCheckUsername = null;
        return null;
    }
    try {
        if(Date.now()-lastCheckTimestamp > 5000 || username !== lastCheckUsername) {
            const req = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count?timestamp=${Date.now()}`);
            const res = await req.json();
            lastCheckTimestamp = Date.now();
            lastCheckUsername = username;
            lastMsgCount = res.count;
            return res.count;
        } else {
            return lastMsgCount;
        }
    } catch(err) {
        return null;
    }
}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request === "getMsgCount") {
        const count = await scratchAddons.methods.getMsgCount();
        chrome.tabs.sendMessage(sender.tab.id, {setMsgCount: count});
    }
});