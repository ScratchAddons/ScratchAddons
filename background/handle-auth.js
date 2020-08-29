(async function () {
  await checkSession();
  scratchAddons.localState.ready.auth = true;
})();

chrome.cookies.onChanged.addListener(({ cookie, changeCause }) => {	
  if (cookie.name === "scratchsessionsid" || cookie.name === "scratchlanguage" || cookie.name === "scratchcsrftoken") checkSession();	
});

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
        csrfToken: null,
        scratchLang: null
      };
      resolve();
    } else {
      let csrfToken = null;
      let scratchLang = null;
      chrome.cookies.get(
        {
          url: "https://scratch.mit.edu/",
          name: "scratchcsrftoken",
        },
        (cookie) => {
          if (cookie && cookie.value) csrfToken = cookie.value;
          chrome.cookies.get(
            {
              url: "https://scratch.mit.edu/",
              name: "scratchlanguage",
            },
            (cookie) => {
              if(cookie && cookie.value) scratchLang = cookie.value;
              else scratchLang = navigator.language;
              scratchAddons.globalState.auth = {
                isLoggedIn: true,
                username: json.user.username,
                userId: json.user.id,
                xToken: json.user.token,
                csrfToken,
                scratchLang
              };
              resolve();
            });
        }
      );
    }
  });
}
