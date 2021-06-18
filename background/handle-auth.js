(async function () {
  await checkSession();
  scratchAddons.localState.ready.auth = true;
})();

chrome.cookies.onChanged.addListener(({ cookie, changeCause }) => {
  if (cookie.name === "scratchsessionsid" || cookie.name === "scratchlanguage" || cookie.name === "scratchcsrftoken")
    checkSession();
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
  const isNewStudiosAvailable = json?.flags?.new_studios_launched;
  scratchAddons.globalState.auth = {
    isLoggedIn: Boolean(json.user),
    username: json.user ? json.user.username : null,
    userId: json.user ? json.user.id : null,
    xToken: json.user ? json.user.token : null,
    csrfToken,
    scratchLang,
    isNewStudiosAvailable,
  };
  // TODO: remove in 1.17.0
  if (isNewStudiosAvailable) {
    const onManifestsLoaded = () => {
      scratchAddons.manifests.forEach(({ addonId, manifest }) => {
        if (addonId !== "studio-tools") return;
        manifest.tags = manifest.tags.filter((tag) => tag !== "recommended");
        manifest.tags.push("beta");
      });
    };
    if (scratchAddons.localState.ready.manifests) {
      onManifestsLoaded();
    } else {
      scratchAddons.localEvents.addEventListener("manifestsReady", onManifestsLoaded, { once: true });
    }
  }
}
