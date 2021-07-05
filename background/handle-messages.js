const COUNT_CHECK_INTERVAL = 30000;
const MSGS_CHECK_INTERVAL = 120000; // Ignored if message count change has been seen

// For getMsgCount
/** @type {number} */
let lastCountCheck = 0;

/** @type {number} */
let lastMsgCount;

let currentlyCheckingCount = false;

/** @type {string | undefined} */
let lastCheckUsernameCount;

/** @type {((value: any) => void)[]} */
const msgCountPromises = [];

// For getMessages. These only apply for offset 0.
/** @type {number} */
let lastMessagesCheck;

/** @type {null} */
let lastMsgsArray;

let currentlyCheckingMessages = false;

/** @type {string | null} */
let lastCheckUsernameMessages;

/** @type {((value: any) => void)[]} */
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
    lastMsgCount = 0;
    lastCheckUsernameCount = username;
    return undefined;
  }
  try {
    if (Date.now() - lastCountCheck > COUNT_CHECK_INTERVAL || username !== lastCheckUsernameCount) {
      const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count?timestamp=${Date.now()}`);
      if (!res.ok) return undefined;
      const json = await res.json();
      if (json.count !== lastMsgCount) lastMessagesCheck;
      lastCountCheck = Date.now();
      lastCheckUsernameCount = username;
      lastMsgCount = json.count;
      return json.count;
    } else {
      return lastMsgCount;
    }
  } catch (err) {
    console.error("Error checking message count:", err);
    return null;
  }
}
scratchAddons.methods.clearMessages = async function () {
  const headers = new Headers();
  headers.set("x-csrftoken", `${scratchAddons.globalState.auth.csrfToken}`);
  headers.set("x-requested-with", "XMLHttpRequest");
  const res = await fetch("https://scratch.mit.edu/site-api/messages/messages-clear/?sareferer", {
    method: "POST",
    headers,
  });
  if (res.ok) {
    lastCountCheck = Date.now();
    lastMsgCount = 0;
  }
};

scratchAddons.methods.getMessages = async function ({ offset = 0 } = {}) {
  if (offset !== 0) return requestMessages({ offset });
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
/** @param {{ offset: number }} options */
async function checkMessages(options) {
  currentlyCheckingMessages = true;
  const username = scratchAddons.globalState.auth.username;
  if (!username) {
    lastMsgsArray = null;
    lastCheckUsernameMessages = null;
    return null;
  }
  try {
    if (Date.now() - lastMessagesCheck > MSGS_CHECK_INTERVAL || username !== lastCheckUsernameMessages) {
      const json = await requestMessages(options);
      lastMessagesCheck = Date.now();
      lastCheckUsernameMessages = username;
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
/** @param {{ offset: number }} options */
async function requestMessages(options) {
  try {
    const headers = new Headers();
    headers.set("X-Token", `${scratchAddons.globalState.auth.xToken}`);
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${scratchAddons.globalState.auth.username}/messages?limit=40&offset=${options.offset}`,
      {
        headers: headers,
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

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request === "getMsgCount") {
    (async () => {
      const count = await scratchAddons.methods.getMsgCount?.();
      chrome.tabs.sendMessage(sender.tab?.id || 0, { setMsgCount: { count } }, { frameId: sender.tab?.frameId ?? 0 });
    })();
  }
});
