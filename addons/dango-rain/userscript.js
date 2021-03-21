let dangorain = false, dangoContainerLeft, dangoContainerRight, vissiableDangos, noticeTimeout;
const div = () => document.createElement("div");
const noticeText = div();
noticeText.className = "sa-dango-notice";
// TODO: localize
noticeText.innerText = `The dangos filled on this page are visible because this user had the word "dango" in their "About Me"WIWO section of their profile.
If you would like to do the same to your profile, just include "dango" in there too!
You can always disable this addon on the settings page!
Happy April Fools Day from the ScratchAddon developers!`;

const checkForDango = (text) => {
  text = text.value || text.textContent;
  if (!text.includes("dango")) {
    if (dangorain && dangoContainerLeft) {
      dangoContainerLeft?.remove();
      dangoContainerRight?.remove();
      noticeText?.remove();
    }
    dangorain = false
    return;
  };
  if (dangorain) return;
  dangorain = true;
  dangoContainerLeft = div();
  dangoContainerLeft.className = "sa-dangos-left"
  for (let i = 0; i < 40; i++) {
    const dango = div();
    dango.className = "sa-dango";
    dango.style.left = (i % 10) * 10 + "%"
    dango.style.animationDelay = `${Math.random() * 8}s, ${Math.random() * 8}s`
    dangoContainerLeft.append(dango);
  }
  setEltWidth(dangoContainerLeft);

  dangoContainerRight = dangoContainerLeft.cloneNode(true);
  dangoContainerRight.className = "sa-dangos-right";

  document.querySelector("#content").append(dangoContainerLeft, dangoContainerRight, noticeText);
}
const setEltWidth = (elt) => {
  if (!elt) return;
  let sideWidth = (document.body.clientWidth - document.querySelector("#profile-data").clientWidth) / 2;
  sideWidth = ((sideWidth - 25) | 0);
  elt.style.width = sideWidth + "px";
  let old = vissiableDangos;
  vissiableDangos = sideWidth > 0;
  if (vissiableDangos) {
    clearTimeout(noticeTimeout);
    if (!old) {
      document.querySelector("#content").append(noticeText);
    }
  } else {
    // Window resizing is very weird on some devices...
    // Some devices might make the notice text "flicker".
    clearTimeout(noticeTimeout);
    noticeTimeout = setTimeout(() => {
      noticeText?.remove();
    }, 1000);
  }
}
addEventListener('resize', () => {
  setEltWidth(dangoContainerLeft);
  setEltWidth(dangoContainerRight);
});

export default async function ({ addon, global, console }) {
  const now = new Date().getTime();
  const runDangos = addon.settings.get("force") || now < 1617364800 && now > 1617192000;
  if (!runDangos) return;
  while (true) {
    const bio = await addon.tab.waitForElement('.overview, [name="bio"]', { markAsSeen: true });
    checkForDango(bio);
    bio.oninput = () => checkForDango(bio);
  }
}
