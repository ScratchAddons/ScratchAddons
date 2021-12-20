export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  let lastDateTime;
  let data;
  let pendingAuthChange = false;
  let addonEnabled = true;
  const defaultUsername = await addon.auth.fetchUsername();

  const getDefaultData = (username) => ({
    messages: [],
    lastMsgCount: null,
    username,
    ready: false,
  });

  addon.auth.addEventListener("change", () => (pendingAuthChange = true));
  resetData(defaultUsername);
  routine();

  function resetData(username) {
    lastDateTime = null;
    data = getDefaultData(username);
  }

  async function routine() {
    await runCheckMessagesAfter({ checkOld: true }, 0);
    while (addonEnabled) {
      if (pendingAuthChange) {
        pendingAuthChange = false;
        resetData(await addon.auth.fetchUsername());
        routine();
        break;
      } else {
        await runCheckMessagesAfter({}, 5000);
      }
    }
  }

  function runCheckMessagesAfter(args, ms) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        await checkMessages(args).catch((e) => console.warn("Error checking messages", e));
        resolve();
      }, ms);
    });
  }

  async function checkMessages({ checkOld = false } = {}) {
    if (!(await addon.auth.fetchIsLoggedIn())) return;
    const username = await addon.auth.fetchUsername();

    // Check if message count changed, if not, return
    const msgCount = await addon.account.getMsgCount();
    if (data.lastMsgCount === msgCount) return;
    data.lastMsgCount = msgCount;

    let checkedMessages = [];
    data.ready = false;

    if (checkOld) {
      const messagesToCheck = msgCount > 1000 ? 1000 : msgCount < 41 ? 40 : msgCount;
      const seenMessageIds = [];
      for (let checkedPages = 0; seenMessageIds.length < messagesToCheck; checkedPages++) {
        const messagesPage = await addon.account.getMessages({ offset: checkedPages * 40 });
        if (messagesPage === null || messagesPage.length === 0) break;
        for (const message of messagesPage) {
          // Make sure we don't add the same message twice,
          // it could happen since we request through pages
          if (!seenMessageIds.includes(message.id)) {
            seenMessageIds.push(message.id);
            checkedMessages.push(message);
            if (seenMessageIds.length === msgCount && msgCount > 39) break;
          }
        }
        if (messagesPage.length !== 40) break;
      }
    } else {
      checkedMessages = await addon.account.getMessages({ offset: 0 });
    }
    if (checkedMessages === null) return;
    if (!checkOld && lastDateTime === null) lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();
    else {
      for (const message of checkedMessages) {
        if (!checkOld && new Date(message.datetime_created).getTime() <= lastDateTime) break;
        if (checkOld) data.messages.push(message);
        else data.messages.unshift(message);
      }
      if (data.messages.length > 40 && msgCount < 41) {
        // Remove extra messages
        data.messages.length = 40;
      }
      if (data.messages.length > 1000) {
        data.messages.length = 1000;
      }
    }
    lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();

    data.stMessages = await (
      await fetch(`https://api.scratch.mit.edu/users/${username}/messages/admin`, {
        headers: {
          "x-token": await addon.auth.fetchXToken(),
        },
      })
    ).json();

    data.ready = true;
  }

  const messageListener = (request, sender, sendResponse) => {
    if (!request.scratchMessaging) return;
    const popupRequest = request.scratchMessaging;
    if (popupRequest === "getData") {
      addon.auth
        .fetchIsLoggedIn()
        .then((isLoggedIn) => sendResponse(data.ready ? data : { error: isLoggedIn ? "notReady" : "loggedOut" }));
      return true;
    } else if (popupRequest === "markAsRead") {
      addon.account.clearMessages();
    }
  };
  chrome.runtime.onMessage.addListener(messageListener);
  addon.self.addEventListener("disabled", () => {
    chrome.runtime.onMessage.removeListener(messageListener);
    addonEnabled = false;
  });
}
