export default async function ({ addon, msg, console }) {
  addon.messaging.onMessage(async ({ type, username }, callback) => {
    if (type === "add-account") {
      chrome.cookies.get({ url: "https://scratch.mit.edu/", name: "accounts" }, async (cookie) => {
        let accounts = {};
        if (cookie) {
          accounts = JSON.parse(cookie.value);
        }
        username = await addon.auth.fetchUsername();
        accounts[username] = addon.auth.sessionId;
        chrome.cookies.set(
          {
            url: "https://scratch.mit.edu/",
            name: "accounts",
            value: JSON.stringify(accounts),
            secure: true,
            httpOnly: true,
          },
          () => callback({})
        );
      });
    }
    if (type === "remove-account") {
      chrome.cookies.get({ url: "https://scratch.mit.edu/", name: "accounts" }, async (cookie) => {
        if (cookie) {
          const accounts = JSON.parse(cookie.value);
          username = await addon.auth.fetchUsername();
          delete accounts[username];
          chrome.cookies.set(
            {
              url: "https://scratch.mit.edu/",
              name: "accounts",
              value: JSON.stringify(accounts),
              secure: true,
              httpOnly: true,
            },
            () => callback({})
          );
        }
      });
    }
    if (type === "switch-account") {
      chrome.cookies.get({ url: "https://scratch.mit.edu/", name: "accounts" }, (cookie) => {
        if (cookie) {
          const accounts = JSON.parse(cookie.value);
          const sessionId = accounts[username];
          chrome.cookies.set(
            {
              url: "https://scratch.mit.edu/",
              domain: ".scratch.mit.edu",
              name: "scratchsessionsid",
              value: sessionId,
              secure: true,
              httpOnly: true,
            },
            () => callback({})
          );
        }
      });
    }
    if (type === "get-accounts") {
      chrome.cookies.get({ url: "https://scratch.mit.edu/", name: "accounts" }, (cookie) => {
        if (cookie) {
          const accounts = Object.keys(JSON.parse(cookie.value));
          callback(accounts);
        } else {
          callback([]);
        }
      });
    }
  });
}
