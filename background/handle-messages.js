let lastCheckUsername = null;

// For getMsgCount
let lastCountCheck = null;
let lastMsgCount = null;
let currentlyCheckingCount = false;
const msgCountPromises = [];

// For getMessages. These only apply for offset 0.
let lastMessagesCheck = null;
let lastMsgsArray = null;
let currentlyCheckingMessages = false;
const msgsArrayPromises = [];

scratchAddons.methods.getMsgCount = function () {
  const newPromise = new Promise((resolve) => msgCountPromises.push(resolve));
  if (!currentlyCheckingCount)
    updateMsgCount().then((value) => {
      msgCountPromises.forEach((resolve) => resolve(value));
      msgCountPromises.length = 0;
      currentlyCheckingCount = false;
    });
  return newPromise;
};
async function updateMsgCount() {
  currentlyCheckingCount = true;
  const username = scratchAddons.globalState.auth.username;
  if (!username) {
    lastMsgCount = null;
    lastCheckUsername = null;
    return null;
  }
  try {
    if (Date.now() - lastCountCheck > 5000 || username !== lastCheckUsername) {
      const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count?timestamp=${Date.now()}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.count !== lastMsgCount) lastMessagesCheck = null;
      lastCountCheck = Date.now();
      lastCheckUsername = username;
      lastMsgCount = json.count;
      return json.count;
    } else {
      return lastMsgCount;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}

scratchAddons.methods.getMessages = async function ({ offset = 0 } = {}) {
  if (offset !== 0) return await requestMessages({ offset });
  else {
    const newPromise = new Promise((resolve) => msgsArrayPromises.push(resolve));
    if (!currentlyCheckingMessages)
      checkMessages({ offset }).then((value) => {
        msgsArrayPromises.forEach((resolve) => resolve(value));
        msgsArrayPromises.length = 0;
        currentlyCheckingMessages = false;
      });
    return newPromise;
  }
};
async function checkMessages(options) {
  currentlyCheckingMessages = true;
  const username = scratchAddons.globalState.auth.username;
  if (!username) {
    lastMsgsArray = null;
    lastCheckUsername = null;
    return null;
  }
  try {
    if (Date.now() - lastMessagesCheck > 60000 || username !== lastCheckUsername) {
      const json = await requestMessages(options);
      lastMessagesCheck = Date.now();
      lastCheckUsername = username;
      lastMsgsArray = json;
      return json;
    } else {
      return lastMsgsArray;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function requestMessages(options) {
  try {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${scratchAddons.globalState.auth.username}/messages?limit=40&offset=${options.offset}`,
      {
        headers: {
          "X-Token": scratchAddons.globalState.auth.xToken,
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(err);
    return null;
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "getMsgCount") {
    (async () => {
      const count = await scratchAddons.methods.getMsgCount();
      chrome.tabs.sendMessage(sender.tab.id, { setMsgCount: count });
    })();
  }
});
