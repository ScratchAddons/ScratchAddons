(async function () {
  await checkSession();
  scratchAddons.localState.ready.auth = true;
  chrome.cookies.onChanged.addListener(({ cookie, changeCause }) => {
    if (cookie.name === "scratchsessionsid" && changeCause !== "overwrite") checkSession();
  });
})();

function checkSession() {
  return new Promise(async (resolve) => {
    const res = await fetch("https://scratch.mit.edu/session/", {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const json = await res.json();
    if (!json.user) {
      scratchAddons.globalState.auth = {
        isLoggedIn: false,
        username: null,
        userId: null,
        xToken: null,
        sessionId: null,
        csrfToken: null,
      };
      resolve();
    } else {
      let sessionId = null;
      let csrfToken = null;
      chrome.cookies.get(
        {
          url: "https://scratch.mit.edu/",
          name: "scratchcsrftoken",
        },
        (cookie) => {
          if (cookie.value) csrfToken = cookie.value;
          chrome.cookies.get(
            {
              url: "https://scratch.mit.edu/",
              name: "scratchsessionsid",
            },
            (cookie) => {
              if (cookie.value) sessionId = cookie.value;
              scratchAddons.globalState.auth = {
                isLoggedIn: true,
                username: json.user.username,
                userId: json.user.id,
                xToken: json.user.token,
                sessionId,
                csrfToken,
              };
              resolve();
            }
          );
        }
      );
    }
  });
}
