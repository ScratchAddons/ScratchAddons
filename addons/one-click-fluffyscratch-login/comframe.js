const FLUFFYSCRATCH_ORIGIN = "https://fluffyscratch.hampton.pw";
const { projectId } = await (await fetch("consts.json")).json();
window.parent.postMessage({ oneClickFluffyScratchLogin: true, loaded: true }, FLUFFYSCRATCH_ORIGIN);
let username;
chrome.runtime.sendMessage({ contentScriptReady: { url: location.href } }, ({ globalState: { auth } }) => {
  if (auth.isLoggedIn) {
    username = auth.username;
    window.parent.postMessage(
      {
        oneClickFluffyScratchLogin: true,
        isLoggedIn: true,
        userId: auth.userId,
        username: auth.username,
      },
      FLUFFYSCRATCH_ORIGIN
    );
  } else {
    window.parent.postMessage({ oneClickFluffyScratchLogin: true, isLoggedIn: false }, FLUFFYSCRATCH_ORIGIN);
  }
});
window.addEventListener("message", (e) => {
  if (
    e.origin == FLUFFYSCRATCH_ORIGIN &&
    e.data.oneClickFluffyScratchLogin &&
    typeof e.data.publicCode !== "undefined"
  ) {
    let key = "fluffyscratch-" + crypto.getRandomValues(new Uint8Array(8)).join("");
    chrome.runtime.sendMessage(
      {
        setTemporaryState: true,
        key,
        value: { publicCode: e.data.publicCode, redirect: e.data.redirect },
      },
      () => (window.top.location.href = "https://scratch.mit.edu/projects/" + projectId + "/#" + key)
    );
  }
});
