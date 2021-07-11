const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

function getDefaultStoreId() {
  // Extensions are executed on the default store.
  // To get the default store ID reliably, we need to set cookies ourselves.
  // We can't just grab it from existing cookies because that'll break in case
  // someone deletes cookies.
  // The temporary cookie expires after 10 seconds but is removed anyway.
  return promisify(chrome.cookies.set)({
    sameSite: chrome.cookies.SameSiteStatus.STRICT,
    url: "https://scratch.mit.edu/",
    name: "satemporarycookie",
    value: "1",
    expirationDate: 10 + Math.floor(Date.now() / 1000),
  })
    .then((cookie) => {
      return (scratchAddons.cookieStoreId = cookie.storeId);
    })
    .finally(() =>
      promisify(chrome.cookies.remove)({
        url: "https://scratch.mit.edu/",
        name: "satemporarycookie",
      })
    );
}

(async function () {
  await getDefaultStoreId();
  await checkSession();
  scratchAddons.localState.ready.auth = true;
})();

chrome.cookies.onChanged.addListener(({ cookie, changeCause }) => {
  if (cookie.name === "scratchsessionsid" || cookie.name === "scratchlanguage" || cookie.name === "scratchcsrftoken") {
    if (cookie.storeId === scratchAddons.cookieStoreId) {
      checkSession();
    }
    notifyContentScripts(cookie);
  }
});

function getCookieValue(name) {
  return new Promise((resolve) => {
    chrome.cookies.get(
      {
        url: "https://scratch.mit.edu/",
        name,
      },
      (cookie) => {
        if (cookie && cookie.value) resolve(cookie.value);
        else resolve(null);
      }
    );
  });
}

async function checkSession() {
  let res;
  let json;
  try {
    res = await fetch("https://scratch.mit.edu/session/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    json = await res.json();
  } catch (err) {
    console.warn(err);
    json = {};
    // If Scratch is down, or there was no internet connection, recheck soon:
    if ((res && !res.ok) || !res) setTimeout(checkSession, 60000);
  }
  const scratchLang = (await getCookieValue("scratchlanguage")) || navigator.language;
  const csrfToken = await getCookieValue("scratchcsrftoken");
  scratchAddons.globalState.auth = {
    isLoggedIn: Boolean(json.user),
    username: json.user ? json.user.username : null,
    userId: json.user ? json.user.id : null,
    xToken: json.user ? json.user.token : null,
    csrfToken,
    scratchLang,
  };
}

function notifyContentScripts(cookie) {
  if (cookie.name === "scratchlanguage") return;
  const storeId = cookie.storeId;
  chrome.tabs.query(
    {
      cookieStoreId: storeId,
    },
    (tabs) =>
      tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, "refetchSession", () => void chrome.runtime.lastError))
  );
}
