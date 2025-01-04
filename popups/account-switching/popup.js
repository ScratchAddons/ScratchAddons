const getAccountSwitchingCookie = async () => JSON.parse((await window.cookieStore.get("accountswitching")).value);
const setAccountSwitchingCookieTo = (obj) => {
  obj.extVersion = chrome.runtime.getManifest().version;
  document.cookie = `accountswitching=${JSON.stringify(obj)}; Max-Age=31536000; Path=/; SameSite=Strict`;
};

async function addCurrentAccount() {
  // Remembers the current sessionID for future use.
  // This function must be executed in a webpage context (i.e. not by the service worker)

  const scratchCookieInfo = await chrome.cookies.get({
    url: "https://scratch.mit.edu/",
    name: "scratchsessionsid",
  });
  const currentSessionId = scratchCookieInfo.value;

  if ((await window.cookieStore.get("accountswitching")) === null) {
    setAccountSwitchingCookieTo({ accounts: [], extVersion: null });
  }

  const accountSwitchingCookieValue = await getAccountSwitchingCookie();
  const { accounts } = accountSwitchingCookieValue;
  if (accounts.length >= 5) throw new Error("Can't hold more than 5 accounts");

  accounts.push({
    username: "griffpatch", // TODO
    userId: 123, // TODO,
    sessionId: currentSessionId,
  });
  setAccountSwitchingCookieTo(accountSwitchingCookieValue);
}

async function getSessionIdForAccount(username) {
  // This could technically be called by the service worker in response to any event we want.
  // But ideally, the user should have to interact directly through the SA popup to switch accounts,
  // so it could also be called directly by the popup.

  const accountSwitchingCookieValue = await getAccountSwitchingCookie();
  return accountSwitchingCookieValue.accounts.find((acc) => acc.username === username).sessionId;
}

const setScratchCookieTo = async (newSessionId) => {
  // We only want to change the value of the Scratch session cookie, not its attributes
  // => we can only change the cookie if it already exists.

  const scratchCookieInfo = await chrome.cookies.get({
    url: "https://scratch.mit.edu/",
    name: "scratchsessionsid",
  });

  if (!scratchCookieInfo) throw new Error("Cookie scratchsessionsid does not exist");

  // TODO ensure the cookie holds a valid session ID by fetching /session or similar methods.
  // For example, if the cookie is empty for some reason, we don't want to copy its attributes
  // and replace it with an actual session token.

  // Discard any read-only cookie properties (TODO check Firefox properties)
  delete scratchCookieInfo.hostOnly;
  delete scratchCookieInfo.session;
  // Yes, this will break if browsers add new read-only properties, and that's intentional.

  await chrome.cookies.set({
    url: "https://scratch.mit.edu/",
    ...scratchCookieInfo, // Keep other cookie attributes unchanged (expire date, samesite, etc.)
    value: newSessionId,
  });
};
